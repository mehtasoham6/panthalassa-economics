Model Documentation

This dashboard models the total cost of building and operating a compute deployment at a given nameplate capacity over a fixed analysis window, under two scenarios: a fleet of ocean-based wave-energy nodes (Panthalassa) and a conventional terrestrial data center powered by a combined-cycle gas turbine (CCGT). Both models reduce to the same two output metrics: cost per watt ($/W) and levelized cost of energy (LCOE, in $/MWh), so they can be compared on a like-for-like basis. Importantly, 
Ocean Model (Panthalassa)

Fleet Sizing

The model starts by computing how many active nodes are required to deliver the target capacity. This is simply the target capacity in megawatts divided by the per-node power rating and the sea-state availability fraction. Sea-state availability acts as the ocean equivalent of a capacity factor: it represents the fraction of the year during which wave conditions are within the operating envelope for rated power output. If a node is rated at 3 MW and the sea state is suitable 55% of the time, each node effectively delivers 1.65 MW on average, so more nodes are needed to hit the capacity target.

On top of the active fleet, the model procures a spare fleet. I assumed that some percentage of additional nodes would be held in reserve to cover nodes undergoing maintenance, in transit, or recently lost. Total fleet size (active plus spares) drives all cost lines on the ocean side.

The Supply Chain Multiplier: Because procuring hundreds or thousands of purpose-built marine platforms is an unusual purchasing pattern, the model applies a step-function supply chain multiplier to the hardware and delivery costs. At small fleet sizes (200 nodes or fewer), costs are priced at baseline. Between 201 and 500 nodes, volume discounts kick in at 0.85x. Between 501 and 2,000 nodes, deeper volume discounts apply at 0.80x. Above 2,000 nodes, the model assumes Panthalassa becomes a price-moving buyer in the global market for steel plate, turbine components, and marine fabrication capacity, partially eroding the volume discount back to 0.90x. These thresholds and multipliers are illustrative; I expect the real supply chain dynamics to be more complicated depending on market conditions at the time of procurement.

Cost Lines

Node Fleet (Hardware): The hardware cost covers the manufactured cost of the node platform itself like the hull, the wave energy converter, power conditioning, and the server mounting infrastructure, but not the GPUs. It is priced at a configurable $/W rate applied to the total fleet's nameplate capacity in watts, then multiplied by the supply chain factor.

Delivery: Each node has a separate delivered cost, which covers fabrication, towing to site, and commissioning on-station. This is priced per node (in millions of dollars), multiplied by total fleet size, and again subject to the supply chain multiplier. Delivery and hardware are kept as separate line items because they scale differently with manufacturing maturity—hardware costs tend to fall faster with learning curves than logistical costs.

Satellite Backhaul: The model prices data egress based on a configurable Gbps-per-MW ratio (how much bandwidth must leave each megawatt of compute) times the total capacity, times an annual $/Gbps-year satellite bandwidth price, accumulated over the analysis period. This is a flat-rate approximation; it does not model congestion pricing, coverage gaps, or LEO constellation latency effects. Crucially, this line covers real-time egress only, not bulk data ingest (large dataset or model weight transfers may require physical media transport by vessel).

NRE (Non-Recurring Engineering): A single configurable dollar figure representing the one-time cost to develop the node platform from prototype to manufacturable product such as engineering, testing, certification, and tooling. This is a lump sum added once to total cost.

Operations: Each node requires periodic service vessel visits. The model prices this at a fixed rate per node per visit, with the visit frequency determined by the maintenance interval slider (in months). The per-visit cost is set at $150,000, representing fuel, crew time, and consumables for a service vessel call. This accumulates over the full analysis period across the entire fleet.

Hull and Component Replacement (Biofouling/Corrosion): Marine hardware degrades continuously. The model applies a configurable annual derate percentage that represents the fraction of hull and structural hardware effectively consumed each year by fouling, corrosion, and wear. This is modeled as a compounding annual rate over the analysis period, producing a cumulative replacement fraction. That fraction is applied to the total hardware cost to produce a replacement bill. In reality, this is non-linear and heavily dependent on antifouling coatings, cathodic protection, and inspection regime, but  the model treats it as a smooth annual process for simplicity.

Fleet Replacement (Node Lifetime): Nodes have a finite operating life. If the analysis period exceeds the node lifetime, the entire fleet must be replaced at least once. The model counts how many complete lifetime cycles fit within the analysis period (using integer division) and adds that many full fleet hardware costs. A 5-year analysis with a 7-year node lifetime incurs zero fleet replacements; a 10-year analysis with a 7-year node lifetime incurs one.

Catastrophic Loss: Separate from gradual degradation, the model accounts for nodes lost entirely to catastrophic events like storms, sinking, structural failure, or unrecoverable electrical faults. An annual probability of catastrophic loss is applied as a compounding rate over the analysis period to produce a cumulative probability of loss per node. Multiplied across the total fleet, this gives an expected number of lost nodes; multiplied by the full per-node cost (delivery plus hardware), it produces the expected replacement cost. This is an expected-value calculation, not a tail-risk model.

Nominal Total and LCOE

Total nominal cost is the sum of all six line items: hardware, delivery, backhaul, NRE, operations, hull replacement, fleet replacement, and catastrophic loss. Energy output is computed as nameplate capacity times sea-state availability times 8,760 hours/year times the number of years. LCOE is total cost divided by total energy.

Because ocean compute is a first-of-kind asset class, the model also computes risk-adjusted net-present-value-adjusted totals using a configurable discount rate (default 12%, reflecting a higher risk premium than conventional infrastructure). Year-zero capital expenditures such as hardware, delivery, and NRE are left undiscounted. Recurring costs (backhaul, operations, hull replacement, catastrophic loss) are divided by the number of years to produce an annual figure, then multiplied by the standard present-value annuity factor. Fleet replacement, if it occurs, is discounted as a lump sum at the node lifetime year. NPV energy is computed the same way, discounting each year's output by the same annuity factor, so that NPV LCOE remains a consistent ratio of risk-adjusted cost to risk-adjusted energy.

Ocean Model Defaults

Node Rating: 1 MW
Matches Panthalassa's public specification directly: $1M per node, $1B factory for 1 GW/yr (implying 1,000 nodes at 1 MW each).

Node HW Cost: $1.00/W
Derived directly from Panthalassa's public claims: $1M per node at 1 MW nameplate rating equals exactly $1.00/W. This is aggressive relative to analogous hardware, but plausible if Panthalassa achieves the manufacturing economies implied by a $1B/yr factory at volume. It assumes the factory is running at or near capacity and that learning curve effects have been substantially captured. Skeptical readers should slide to $2–3/W to test sensitivity.

Sea-State Availability: 80%
Set to reflect Panthalassa's public claim of “up to 90% capacity factor.” 80% is used rather than 90% as a mild haircut. The 90% figure likely represents peak-site performance under optimal conditions, and an 80% default accounts for the realistic spread across a deployed fleet at varied ocean sites. For reference, the best offshore wind sites achieve 45–55% capacity factors; 80% would make Panthalassa nodes among the highest-capacity-factor generation assets ever deployed at scale, which is either the wave resource advantage or an aggressive estimate depending on your priors.

Target Capacity: 1 GW
The minimum meaningful unit for a grid-scale compute deployment. 1 GW of IT power is roughly the size of a large hyperscale campus (Meta Pryor, Google Papillion). 

Analysis Period: 5 years
Matches typical infrastructure underwriting horizons for early-stage technology bets. Five years is also short enough that no fleet replacement occurs at the default 15-year node lifetime, which keeps the first-run output clean. Longer periods introduce fleet replacement lump sums that can dominate the total and confuse first-time readers.

Delivered Node Cost: $4M per node
The per-node logistical cost consists of things like fabrication and outfitting at a shipyard, towing to site, and commissioning on-station. $4M for a ~3 MW spar-buoy platform is broadly consistent with offshore energy installation economics: small offshore wind turbine installations run $3–6M per unit for the vessel work alone, before turbine cost. This number does not scale with node rating in the model (it's a flat per-node cost), so it implicitly assumes that larger nodes don't require proportionally larger vessels or longer installation windows.

Biofouling / Corrosion Derate: 2.5%/yr
Represents the fraction of hull and structural hardware effectively consumed annually by marine biological fouling, galvanic corrosion, and mechanical wear. 2.5% is drawn from offshore oil & gas and wave energy literature on uncoated or minimally-coated steel structures in open-ocean environments. Modern antifouling coatings and cathodic protection can push this well below 1%; a neglected or cost-minimized design could see 5%+. The default sits in the middle of that range.

Egress Bandwidth: 5 Gbps/MW
The satellite uplink bandwidth required per megawatt of compute. Inference workloads at high token throughput can generate 1–3 Gbps/MW; fine-tuning jobs with moderate output are similar. 5 Gbps/MW builds in headroom for overhead, telemetry, and mixed workloads. This is one of the model's most uncertain parameters as it depends heavily on the inference serving stack, model size, and batch configuration. Distributed training would require orders of magnitude more, but that use case is excluded from the model's scope.

Satellite Backhaul Cost: $50k/Gbps-yr
Approximates current Starlink Maritime and Starlink Business pricing for high-throughput links, which run roughly $30k–$60k/Gbps-yr depending on contract tier and committed throughput. $50k is a reasonable mid-market estimate for 2025–2026 LEO constellation pricing at the volume a GW-scale deployment would represent. This number has been falling fast so the slider range extends down to $10k/Gbps-yr to capture where the market may be in 3–5 years.

NRE: $0.8B
One-time non-recurring engineering cost to develop the Panthalassa node platform from advanced prototype to manufacturable product. $800M covers deep engineering on the hull design, mooring and station-keeping systems, power-take-off and conditioning electronics, thermal and pressure management for the compute payload, certification, sea trials, and manufacturing tooling. This is roughly consistent with what major offshore energy programs (floating offshore wind platforms, tidal turbine programs) have spent on first-commercial-scale development. However, it is almost certainly an underestimate for a program starting from scratch.

Maintenance Interval: 12 months
Service vessel visits once per year per node. This is the minimum credible interval for open-ocean infrastructure—offshore wind turbines in comparable environments are typically serviced every 6–12 months for scheduled maintenance. Annual visits are operationally tractable with a small dedicated service fleet and set a reasonable baseline.

Node Lifetime: 15 years
Design life before full node replacement. Offshore oil & gas platforms are designed for 20–30 year service lives; small offshore wind turbines are warranted for 20–25 years. 15 years is conservative relative to those benchmarks, reflecting the additional stress of active wave-energy harvesting and the compute payload's heat cycling. 

Catastrophic Loss Rate: 1%/yr
1% per node per year implies that a 100-node fleet expects to lose one node per year on average. This is consistent with attrition rates observed in moored oceanographic buoy programs (which are simpler and cheaper than Panthalassa nodes but face similar hazards). Offshore energy developers typically model lower catastrophic loss rates (0.1–0.3%/yr) for engineered platforms; 1% acknowledges that early-generation deployments may have meaningfully higher loss rates.

Spare Fleet: 10%
10% of additional nodes procured beyond the active fleet needed to meet capacity. This buffer covers nodes in transit for maintenance, awaiting replacement parts, or lost and not yet replaced. 10% is conservative for early deployment phases given that offshore wind farms typically hold 5–8% spare turbine components by value, but spare nodes are entire platforms, not just parts. The right number depends heavily on logistics chain design and acceptable capacity variance.

Ocean Discount Rate: 12%
Risk-adjusted discount rate for NPV calculation. 12% sits between a typical infrastructure project rate (6–8%) and a venture/early-stage rate (20–25%), reflecting that ocean compute is a first-of-kind asset class without an established financing market, but backed by real physical hardware with tangible salvage value. For comparison, offshore wind in emerging markets is financed at 10–14% unlevered; deepwater oil & gas exploration uses 12–15%. As the technology matures and the first deployments de-risk the concept, this rate should compress toward conventional offshore infrastructure financing.


Terrestrial Model (CCGT Data Center)

The terrestrial benchmark is a conventional hyperscale data center powered by a dedicated combined-cycle gas turbine plant. Costs are divided into two capital buckets—data center infrastructure and power generation—plus ongoing fuel costs.

Data Center Infrastructure

The DC infrastructure cost is a single configurable $/W parameter applied to the total IT capacity in watts. This number is based on McCalip's published framework and represents the all-in cost to build the facility. The model breaks this figure into four sub-buckets using fixed industry fractions: electrical systems (42%), mechanical systems (24%), civil/shell (20%), and fit-out (14%). The mechanical bucket is where cooling infrastructure lives and it is this portion that ocean compute avoids entirely by using seawater convection. The breakdown is provided for interpretive clarity but does not affect the total; it's one aggregated $/W number split by standard industry ratios.

PUE (Power Usage Effectiveness): The model uses a configurable PUE, representing the ratio of total facility power draw to IT power. A PUE of 1.3 means the facility consumes 30% more power than the servers themselves, with the overhead going to cooling, lighting, and power distribution losses. PUE affects two things: it scales the power generation capacity that must be procured (a 100 MW IT load with PUE 1.3 requires 130 MW of generation), and it determines fuel consumption (fuel is burned for total facility power, not just IT power).

Power Generation: The gas turbine capital cost is a configurable $/W figure applied to the total generation capacity required (IT capacity × PUE). The model assumes H-class combined-cycle turbines rated at 400 MW each, so the turbine count is ceiling(total generation MW / 400). Turbine capex is a separate line from DC infrastructure.

Fuel Cost: Fuel cost is calculated from first principles: total energy consumed (IT capacity × PUE × 8,760 hours/year × 0.85 capacity factor × years × 1,000 kW/MW) times the heat rate (BTU/kWh) divided by 1,000,000 (to convert BTU to MMBtu) times the gas price ($/MMBtu). The capacity factor of 85% is fixed, representing typical CCGT dispatch availability for a behind-the-meter plant. Gas price and heat rate are both adjustable sliders.

Nominal Total and LCOE: Total terrestrial cost is DC infrastructure plus gas turbine capex plus fuel. Energy output is IT capacity times 0.85 capacity factor times 8,760 hours/year times years. LCOE is total cost over total energy. Note that the fuel consumed to run the cooling and overhead (captured by PUE) is included in the cost but the overhead power is not credited as "useful" output. This is consistent with treating PUE as a cost multiplier rather than an output multiplier.

Risk-Adjusted (NPV) Figures: The terrestrial NPV uses a lower default discount rate (8%) reflecting the established financing markets for proven CCGT and datacenter infrastructure. Capital costs (DC infrastructure and turbine capex) are treated as year-zero expenditures. Fuel is recurring and multiplied by the annuity factor. NPV LCOE is computed with discounted energy in the denominator for consistency with the ocean side.

What the Model Does Not Include

Both columns: No carbon pricing, hedging, or fuel escalation curves. No depreciation, tax treatment, or financing structure. No regulatory, permitting, or insurance costs. GPUs and server hardware costs are excluded from both models; the intent is to compare the infrastructure and power delivery costs upstream of the compute hardware itself. My assumption is that these costs are symmetric and that the GPU failure rate is roughly similar on land or at sea, and thus cancel in any comparison.

Ocean only: No Weibull distribution for wave power. Sea-state availability is a flat annual fraction. No storm season variation or seasonal capacity factor curve. No decommissioning, retrieval, or disposal costs. Self-propulsion and station-keeping are treated as zero opportunity cost. No inter-node connectivity costs (the model assumes node-independent workloads; tightly-coupled distributed training across nodes is not feasible over satellite backhaul). Bulk data ingest is not priced — large dataset and model weight transfers may require physical media transport.

Terrestrial only: Capacity factor is fixed at 85%. No water usage or cooling water cost (these are embedded in the mechanical infrastructure fraction).
