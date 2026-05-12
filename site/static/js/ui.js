// ui.js — slider wiring and DOM updates

function readInputs() {
  const v = id => parseFloat(document.getElementById(id).value);
  return {
    capacity_GW:                    v('capacity-slider'),
    years:                          v('years-slider'),
    node_rating_MW:                 v('node-rating-slider'),
    sea_state_availability:         v('availability-slider'),
    node_hw_cost_per_W:             v('node-hw-slider'),
    delivered_node_cost_M:          v('delivery-cost-slider'),
    biofouling_derate_pct_yr:       v('biofouling-slider'),
    egress_Gbps_per_MW:             v('egress-slider'),
    satellite_backhaul_per_Gbps_yr: v('backhaul-slider'),
    nre_B:                          v('nre-slider'),
    maintenance_interval_months:    v('maint-interval-slider'),
    node_lifetime_yr:               v('node-lifetime-slider'),
    catastrophic_loss_pct_yr:       v('cat-loss-slider'),
    spare_fleet_pct:                v('spare-fleet-slider'),
    ocean_discount_rate:            v('ocean-discount-slider'),
    dc_infra_per_W:                 v('facility-slider'),
    gas_turbine_capex_per_W:        v('gas-turbine-slider'),
    heat_rate_BTU_per_kWh:          v('heat-rate-slider'),
    gas_price_per_MMBtu:            v('gas-price-slider'),
    pue:                            v('pue-slider'),
    terrestrial_discount_rate:      v('te-discount-slider'),
  };
}

function fmt_B(x) {
  if (x >= 1e9) return '$' + (x / 1e9).toFixed(1) + 'B';
  return '$' + (x / 1e6).toFixed(0) + 'M';
}
function fmt_W(x)   { return '$' + x.toFixed(2) + '/W'; }
function fmt_MWh(x) { return '$' + Math.round(x) + '/MWh'; }

function recompute() {
  const inp  = readInputs();
  const oc   = computeOcean(inp);
  const te   = computeTerrestrial(inp);

  const oc_cpw      = oc.total / (inp.capacity_GW * 1e9);
  const oc_lcoe     = oc.total / oc.energy;
  const oc_npv_lcoe = oc.npv_total / oc.npv_energy;
  const te_cpw      = te.total / (inp.capacity_GW * 1e9);
  const te_lcoe     = te.total / te.energy;
  const te_npv_lcoe = te.npv_total / te.npv_energy;
  const te_capex_cpw = (te.dc_cost + te.pgen_cost) / (inp.capacity_GW * 1e9);

  // Normalise bars to the largest single cost component
  const ref = Math.max(oc.hw, oc.delivery, oc.backhaul, oc.nre_ops_hull, te.elec);
  const pct = x => Math.min(100, (x / ref * 100)).toFixed(2) + '%';

  function setBar(base, width, val) {
    ['', '-mobile'].forEach(sfx => {
      const b = document.getElementById(base + '-bar' + sfx);
      const v = document.getElementById(base + '-value' + sfx);
      if (b) b.style.width = width;
      if (v) v.textContent = val;
    });
  }
  function setText(base, val) {
    ['', '-mobile'].forEach(sfx => {
      const el = document.getElementById(base + sfx);
      if (el) el.textContent = val;
    });
  }

  // Ocean bars (4)
  setBar('ocean-fleet',    pct(oc.hw),            fmt_B(oc.hw));
  setBar('ocean-delivery', pct(oc.delivery),       fmt_B(oc.delivery));
  setBar('ocean-backhaul', pct(oc.backhaul),       fmt_B(oc.backhaul));
  setBar('ocean-nre',      pct(oc.nre_ops_hull),   fmt_B(oc.nre_ops_hull));

  // Terrestrial bars (normalised to ocean hw as reference)
  const te_ref = oc.hw;
  const tp = x => Math.min(100, (x / te_ref * 100)).toFixed(2) + '%';
  setBar('terrestrial-powergen',   tp(te.pgen_cost), fmt_B(te.pgen_cost));
  setBar('terrestrial-electrical', tp(te.elec),      fmt_B(te.elec));
  setBar('terrestrial-mechanical', tp(te.mech),      fmt_B(te.mech));
  setBar('terrestrial-civil',      tp(te.civil),     fmt_B(te.civil));
  setBar('terrestrial-fitout',     tp(te.fitout),    fmt_B(te.fitout));
  setBar('terrestrial-fuel',       tp(te.fuel_cost), fmt_B(te.fuel_cost));

  // Ocean stats
  setText('ocean-total',        fmt_B(oc.total));
  setText('ocean-cpw',          fmt_W(oc_cpw));
  setText('ocean-lcoe',         fmt_MWh(oc_lcoe));
  setText('ocean-active-nodes', oc.N_active.toLocaleString() + ' nodes');
  setText('ocean-total-fleet',  oc.N_total.toLocaleString() + ' nodes');
  setText('ocean-npv-total',    fmt_B(oc.npv_total));
  setText('ocean-npv-lcoe',     fmt_MWh(oc_npv_lcoe));

  // Terrestrial stats
  setText('terrestrial-total',     fmt_B(te.total));
  setText('terrestrial-cpw',       fmt_W(te_cpw));
  setText('terrestrial-lcoe',      fmt_MWh(te_lcoe));
  setText('terrestrial-capex-cpw', fmt_W(te_capex_cpw));
  setText('terrestrial-npv-total', fmt_B(te.npv_total));
  setText('terrestrial-npv-lcoe',  fmt_MWh(te_npv_lcoe));

  // Sticky bottom bar
  const os = document.getElementById('ocean-total-sticky');
  const ts = document.getElementById('terrestrial-total-sticky');
  if (os) os.textContent = fmt_B(oc.total);
  if (ts) ts.textContent = fmt_B(te.total);

  // Engineering outputs
  const eg = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  eg('eng-ocean-active-nodes',      oc.N_active.toLocaleString() + ' nodes');
  eg('eng-ocean-total-fleet',       oc.N_total.toLocaleString() + ' nodes');
  eg('eng-ocean-node-rating',       inp.node_rating_MW.toFixed(2) + ' MW');
  eg('eng-ocean-sea-area',          (oc.N_total * 0.25).toFixed(0) + ' km²');
  eg('eng-ocean-energy',            (oc.energy / 1e6).toFixed(2) + 'M MWh');
  eg('eng-ocean-egress',            (inp.capacity_GW * 1000 * inp.egress_Gbps_per_MW / 1000).toFixed(1) + ' Tbps');
  eg('eng-ocean-backhaul-per-mwh',  fmt_MWh(oc.backhaul / oc.energy));
  eg('eng-ocean-sc-factor',         oc.sc_mult.toFixed(2) + '× (' + oc.sc_label + ')');
  eg('eng-ngcc-turbines',           te.turbines + ' units');
  eg('eng-ngcc-generation',         Math.round(inp.capacity_GW * 1000 * inp.pue) + ' MW');
  eg('eng-ngcc-heat-rate',          inp.heat_rate_BTU_per_kWh.toLocaleString() + ' BTU/kWh');
  eg('eng-ngcc-fuel-cost',          '$' + Math.round(te.fuel_cost / te.energy) + '/MWh');
  eg('eng-ngcc-gas-consumption',    Math.round(te.gas_BCF) + ' BCF');
  eg('eng-ngcc-energy',             (te.energy / 1e6).toFixed(2) + 'M MWh');

  // Auto-fill findings callout
  const fc = document.getElementById('findings-callout');
  if (fc) {
    const ratio_cpw = oc_cpw / te_cpw;
    const ratio_npv = oc.npv_total / te.npv_total;
    fc.innerHTML = `<p>At these inputs, ocean compute costs <strong>${fmt_W(oc_cpw)}</strong> vs. terrestrial <strong>${fmt_W(te_cpw)}</strong> — <strong>${ratio_cpw.toFixed(2)}×</strong> on a nominal basis. Risk-adjusted (${Math.round(inp.ocean_discount_rate*100)}% ocean / ${Math.round(inp.terrestrial_discount_rate*100)}% terrestrial discount): ${fmt_B(oc.npv_total)} vs. ${fmt_B(te.npv_total)}, <strong>${ratio_npv.toFixed(2)}×</strong>. Ocean LCOE: ${fmt_MWh(oc_lcoe)} nominal, ${fmt_MWh(oc_npv_lcoe)} risk-adjusted.</p>`;
  }

  // dc-breakdown per-W labels
  ['dc-electrical','dc-mechanical','dc-shell','dc-fitout','dc-site','dc-fees'].forEach((id, i) => {
    const fracs = [0.45, 0.20, 0.17, 0.08, 0.05, 0.05];
    const el = document.getElementById(id);
    if (el) el.textContent = '$' + (inp.dc_infra_per_W * fracs[i]).toFixed(2) + '/W';
  });

  // Slider fill widths
  function updateFill(sliderId, fillId, min, max) {
    const s = document.getElementById(sliderId);
    const f = document.getElementById(fillId);
    if (s && f) f.style.width = ((s.value - min) / (max - min) * 100).toFixed(2) + '%';
  }
  updateFill('capacity-slider',      'capacity-fill',       1,     100);
  updateFill('years-slider',         'years-fill',          3,     10);
  updateFill('node-rating-slider',   'node-rating-fill',    0.25,  10);
  updateFill('availability-slider',  'availability-fill',   0.30,  0.85);
  updateFill('node-hw-slider',       'node-hw-fill',        1,     10);
  updateFill('delivery-cost-slider', 'delivery-cost-fill',  1,     50);
  updateFill('biofouling-slider',    'biofouling-fill',     1,     10);
  updateFill('egress-slider',        'egress-fill',         1,     20);
  updateFill('backhaul-slider',      'backhaul-fill',       10000, 200000);
  updateFill('nre-slider',           'nre-fill',            0,     10);
  updateFill('maint-interval-slider','maint-interval-fill', 3,     24);
  updateFill('node-lifetime-slider', 'node-lifetime-fill',  5,     30);
  updateFill('cat-loss-slider',      'cat-loss-fill',       0,     5);
  updateFill('spare-fleet-slider',   'spare-fleet-fill',    0,     25);
  updateFill('ocean-discount-slider','ocean-discount-fill', 0.05,  0.25);
  updateFill('facility-slider',      'facility-fill',       10,    17);
  updateFill('gas-turbine-slider',   'gas-turbine-fill',    1.45,  2.30);
  updateFill('heat-rate-slider',     'heat-rate-fill',      6000,  9000);
  updateFill('gas-price-slider',     'gas-price-fill',      2,     15);
  updateFill('pue-slider',           'pue-fill',            1.1,   1.5);
  updateFill('te-discount-slider',   'te-discount-fill',    0.05,  0.15);

  // Slider value labels
  document.getElementById('capacity-value').textContent      = inp.capacity_GW + ' GW';
  document.getElementById('years-value').textContent         = inp.years + ' years';
  document.getElementById('node-rating-value').textContent   = inp.node_rating_MW.toFixed(2) + ' MW';
  document.getElementById('availability-value').textContent  = Math.round(inp.sea_state_availability * 100) + '%';
  document.getElementById('node-hw-value').textContent       = '$' + inp.node_hw_cost_per_W + '/W';
  document.getElementById('delivery-cost-value').textContent = '$' + inp.delivered_node_cost_M + 'M';
  document.getElementById('biofouling-value').textContent    = inp.biofouling_derate_pct_yr + '%/yr';
  document.getElementById('egress-value').textContent        = inp.egress_Gbps_per_MW + ' Gbps/MW';
  document.getElementById('backhaul-value').textContent      = '$' + (inp.satellite_backhaul_per_Gbps_yr / 1000).toFixed(0) + 'k/Gbps-yr';
  document.getElementById('nre-value').textContent           = '$' + inp.nre_B.toFixed(1) + 'B';
  document.getElementById('maint-interval-value').textContent = inp.maintenance_interval_months + ' months';
  document.getElementById('node-lifetime-value').textContent  = inp.node_lifetime_yr + ' yr';
  document.getElementById('cat-loss-value').textContent      = inp.catastrophic_loss_pct_yr.toFixed(1) + '%/yr';
  document.getElementById('spare-fleet-value').textContent   = inp.spare_fleet_pct + '%';
  document.getElementById('ocean-discount-value').textContent = Math.round(inp.ocean_discount_rate * 100) + '%';
  document.getElementById('facility-value').textContent      = '$' + inp.dc_infra_per_W.toFixed(2) + '/W';
  document.getElementById('gas-turbine-value').textContent   = '$' + inp.gas_turbine_capex_per_W.toFixed(2) + '/W';
  document.getElementById('heat-rate-value').textContent     = inp.heat_rate_BTU_per_kWh.toLocaleString() + ' BTU/kWh';
  document.getElementById('gas-price-value').textContent     = '$' + inp.gas_price_per_MMBtu.toFixed(2) + '/MMBtu';
  document.getElementById('pue-value').textContent           = inp.pue.toFixed(2);
  document.getElementById('te-discount-value').textContent   = Math.round(inp.terrestrial_discount_rate * 100) + '%';
}

// Wire all sliders + render KaTeX equation
document.addEventListener('DOMContentLoaded', () => {
  // Info icon popover
  const pop = document.createElement('div');
  pop.id = 'info-popover';
  document.body.appendChild(pop);

  document.querySelectorAll('.info-icon').forEach(icon => {
    icon.addEventListener('click', e => {
      e.stopPropagation();
      pop.innerHTML = icon.dataset.tip;
      pop.style.display = 'block';
      const r = icon.getBoundingClientRect();
      const left = Math.min(r.left, window.innerWidth - 242);
      pop.style.left = Math.max(6, left) + 'px';
      pop.style.top  = (r.bottom + 6) + 'px';
    });
  });
  document.addEventListener('click', () => { pop.style.display = 'none'; });

  if (window.katex) {
    const eqEl = document.getElementById('wave-power-eq');
    if (eqEl) katex.render(
      'P = \\dfrac{\\rho g^2}{64\\pi} \\cdot H_s^2 \\cdot T_e',
      eqEl,
      { displayMode: true, throwOnError: false }
    );
  }
  document.querySelectorAll('input[type="range"]').forEach(s => s.addEventListener('input', recompute));
  recompute();
});
