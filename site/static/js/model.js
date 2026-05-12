// model.js — pure cost functions, no DOM access

function computeOcean(i) {
  const N_active = Math.ceil((i.capacity_GW * 1000) / (i.node_rating_MW * i.sea_state_availability));
  const N_total  = Math.ceil(N_active * (1 + i.spare_fleet_pct / 100));

  let sc_mult, sc_label;
  if      (N_total <= 200)  { sc_mult = 1.00; sc_label = 'baseline'; }
  else if (N_total <= 500)  { sc_mult = 0.85; sc_label = 'volume discount'; }
  else if (N_total <= 2000) { sc_mult = 0.80; sc_label = 'volume discount'; }
  else                      { sc_mult = 0.90; sc_label = 'bottleneck premium'; }

  const hw       = N_total * i.node_rating_MW * 1e6 * i.node_hw_cost_per_W * sc_mult;
  const delivery = N_total * i.delivered_node_cost_M * 1e6 * sc_mult;

  const bw_Gbps  = i.capacity_GW * 1000 * i.egress_Gbps_per_MW;
  const backhaul = bw_Gbps * i.satellite_backhaul_per_Gbps_yr * i.years;

  const nre = i.nre_B * 1e9;

  const ops = (12 / i.maintenance_interval_months) * 150_000 * N_total * i.years;

  const repl_f    = 1 - Math.pow(1 - i.biofouling_derate_pct_yr / 100, i.years);
  const hull_repl = hw * repl_f;

  const fleet_repl = Math.floor(i.years / i.node_lifetime_yr) * hw;

  // Catastrophic loss: storms, sinking, unrecoverable electrical failures
  const cost_per_node = i.delivered_node_cost_M * 1e6 + i.node_rating_MW * 1e6 * i.node_hw_cost_per_W;
  const cat_f    = 1 - Math.pow(1 - i.catastrophic_loss_pct_yr / 100, i.years);
  const cat_cost = N_total * cat_f * cost_per_node;

  const nre_ops_hull = nre + ops + hull_repl + fleet_repl + cat_cost;
  const total        = hw + delivery + backhaul + nre_ops_hull;
  const energy       = i.capacity_GW * 1000 * i.sea_state_availability * 8760 * i.years;

  // NPV: year-0 capex (hw, delivery, nre) undiscounted; recurring costs use annuity factor
  const r   = i.ocean_discount_rate;
  const ann = r > 0 ? (1 - Math.pow(1 + r, -i.years)) / r : i.years;
  const annual_recurring = (backhaul + ops + hull_repl + cat_cost) / i.years;
  // fleet_repl is a lump sum at node_lifetime_yr if it falls within analysis period
  const npv_fleet_repl = fleet_repl > 0 ? fleet_repl * Math.pow(1 + r, -i.node_lifetime_yr) : 0;
  const npv_total  = hw + delivery + nre + annual_recurring * ann + npv_fleet_repl;
  const npv_energy = i.capacity_GW * 1000 * i.sea_state_availability * 8760 * ann;

  return { N_active, N_total, sc_mult, sc_label, hw, delivery, backhaul, cat_cost, nre_ops_hull, total, energy, npv_total, npv_energy };
}

function computeTerrestrial(i) {
  const dc_cost   = i.dc_infra_per_W * i.capacity_GW * 1e9;
  const pgen_cost = i.gas_turbine_capex_per_W * i.pue * i.capacity_GW * 1e9;
  const elec      = 0.42 * dc_cost;
  const mech      = 0.24 * dc_cost;
  const civil     = 0.20 * dc_cost;
  const fitout    = 0.14 * dc_cost;
  const kwh_total = i.capacity_GW * 1000 * i.pue * 8760 * 0.85 * i.years * 1e3;
  const fuel_cost = kwh_total * i.heat_rate_BTU_per_kWh * i.gas_price_per_MMBtu / 1e6;
  const total     = dc_cost + pgen_cost + fuel_cost;
  const energy    = i.capacity_GW * 1000 * 0.85 * 8760 * i.years;
  const turbines  = Math.ceil(i.capacity_GW * 1000 * i.pue / 400);
  const gas_BCF   = kwh_total * i.heat_rate_BTU_per_kWh / 1e12;

  // NPV: capex (dc + pgen) at year 0; fuel recurring
  const r   = i.terrestrial_discount_rate;
  const ann = r > 0 ? (1 - Math.pow(1 + r, -i.years)) / r : i.years;
  const annual_fuel = fuel_cost / i.years;
  const npv_total   = dc_cost + pgen_cost + annual_fuel * ann;
  const npv_energy  = i.capacity_GW * 1000 * 0.85 * 8760 * ann;

  return { dc_cost, pgen_cost, elec, mech, civil, fitout, fuel_cost, total, energy, turbines, gas_BCF, npv_total, npv_energy };
}
