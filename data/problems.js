/*
 * ============================================================================
 *  MDP FRAMING DRILL — PROBLEM BANK
 * ============================================================================
 *
 *  The file to add or edit practice problems.
 *  Append an object to the array below and reload the page.
 *  Filters (domain chips, difficulty) are derived automatically from the data,
 *  so a brand-new `dom` value just appears.
 *
 *  ---- SCHEMA (every field is a plain string unless noted) -------------------
 *
 *    id     : number   unique, stable. Used to save your progress in the
 *                      browser, so don't renumber existing problems.
 *    title  : string   short scenario name shown on the card.
 *    dom    : string   domain tag, e.g. "recsys", "robotics", "games".
 *                      Reuse existing values so they group; a new one is fine.
 *    diff   : number   difficulty: 1 = easy, 2 = medium, 3 = hard.
 *    q      : string   the scenario prompt ("Design an agent that ...").
 *    ctx    : string   OPTIONAL. Plain-English background + jargon, shown
 *                      behind the "show context" button. Omit it (or leave "")
 *                      and the button simply won't render for that card.
 *
 *    Then the six MDP components (the model answer), all optional but
 *    recommended. Any you omit are just skipped in the answer panel:
 *
 *    state  : string   what the agent observes (make it approximately Markov).
 *    action : string   what the AGENT chooses (not what the environment does).
 *    reward : string   the scalar goal signal.
 *    trans  : string   transition dynamics P(s'|s,a); usually unknown.
 *    disc   : string   discount / horizon: episodic vs continuing, role of γ.
 *    trap   : string   the one conceptual error an examiner is fishing for.
 *
 *  ---- FORMATTING ------------------------------------------------------------
 *
 *    You may use simple inline HTML in any string: <b>…</b> for emphasis,
 *    &minus; &rarr; &gamma; &asymp; for symbols. Keep it to inline tags.
 *
 *  ---- MINIMAL EXAMPLE -------------------------------------------------------
 *
 *    {
 *      id: 99, title: "My scenario", dom: "systems", diff: 2,
 *      q:   "Design an RL agent that ...",
 *      ctx: "Background a non-expert needs. <b>Jargon</b> = plain meaning.",
 *      state:  "…", action: "…", reward: "…",
 *      trans:  "…", disc:   "…", trap:   "…",
 *    },
 * ============================================================================
 */

window.MDP_PROBLEMS = [
  {
    id: 1, title: "TikTok video recommendation", dom: "recsys", diff: 2,
    q: "Design an RL agent that decides which short video to serve a user next in an infinite feed.",
    ctx: "TikTok shows an endless vertical feed of short videos; the user swipes up to get the next one. The system picks each video from a huge catalog. Terms: an <b>embedding</b> is a learned numeric vector summarizing a user's or video's traits; <b>retrieval stage</b> is an upstream step that narrows millions of videos down to a small candidate shortlist.",
    state: "The <b>user</b> is the state, not the video: recent watch history and dwell times, past likes/skips, a learned user embedding, session context (how long they've scrolled), plus features of the candidate videos.",
    action: "Which video to serve next, usually pick one item from a candidate set produced by an upstream retrieval stage (the full catalog is too large to be a flat action space).",
    reward: "+ for watch time and completion, stronger + for like/share/follow, &minus; for fast skips / report / 'not interested'. Ideally shaped toward retention, not just this-session watch time.",
    trans: "P(next user state | shown video) is driven by unpredictable user reaction &rarr; unknown &rarr; model-free RL.",
    disc: "Session = episode. High &gamma; values long-term engagement; low &gamma; produces clickbait.",
    trap: "Two classic errors: (1) the state must center on the <b>user</b> not the current video, or there's no personalization; (2) like/share/stay are <b>user reactions = reward</b>, not agent actions.",
  },
  {
    id: 2, title: "Lane-keeping self-driving car", dom: "robotics", diff: 1,
    q: "An autonomous car must stay centered in its lane on a highway.",
    ctx: "A self-driving feature that keeps the car in the middle of its lane. <b>Lidar</b> is a laser-based distance sensor; <b>heading</b> is the direction the car points. 'Markov' here just means the state must contain enough to predict what happens next without needing the full driving history.",
    state: "Sensor readings: camera/lidar view, distance to left and right lane markings, current speed, heading, steering angle.",
    action: "Continuous steering angle (and possibly throttle/brake). This is a continuous action space.",
    reward: "+ small each step for staying near lane center at target speed, &minus; large for drifting out of lane or collision.",
    trans: "Vehicle dynamics + road: physically real but complex and noisy, effectively unknown &rarr; learn from experience or a simulator.",
    disc: "Continuing task (or episode = one drive/segment). &gamma; near 1 since smooth long-term control matters.",
    trap: "State must be rich enough to be Markov. A single camera frame can't tell velocity, so you stack frames or include speed/heading, otherwise the Markov property fails.",
  },
  {
    id: 3, title: "Chess-playing agent", dom: "games", diff: 1,
    q: "Build an agent that learns to win at chess through self-play.",
    ctx: "<b>Self-play</b> means the agent learns by repeatedly playing against copies of itself. <b>Terminal</b> refers to the game's final position (checkmate, stalemate, or draw). <b>Castling rights / en-passant</b> are special chess rules; the point is only that the state must track them to fully describe the position.",
    state: "The full board position (piece placement), plus castling rights, whose turn, en-passant and move-count info.",
    action: "Choosing a legal move from the current position.",
    reward: "Sparse and terminal: +1 win, &minus;1 loss, 0 draw. Usually 0 on every intermediate move.",
    trans: "Fully known and deterministic given the opponent's policy: the rules define successor states exactly.",
    disc: "Episodic (one game). &gamma; close to 1 because the reward only arrives at the end.",
    trap: "Reward is delayed to the terminal state, so this is a credit-assignment problem: which of 40 moves earned the win? Also note chess is fully observed, unlike poker.",
  },
  {
    id: 4, title: "Elevator dispatch", dom: "control", diff: 2,
    q: "A bank of elevators must serve passengers pressing buttons across floors, minimizing wait time.",
    ctx: "Several elevators serve one building. A <b>hall call</b> is someone on a floor pressing the up/down button; a <b>car call</b> is a passenger already inside pressing a destination floor. The controller decides which car answers which call.",
    state: "Position and direction of each car, set of pending hall calls and car calls, current passenger load estimates.",
    action: "Assign/dispatch cars: which elevator answers which call, or which direction each idle car should move.",
    reward: "&minus; proportional to total passenger waiting time (and travel time); minimize cumulative wait.",
    trans: "Passenger arrivals are random and unknown &rarr; model-free / simulation-based.",
    disc: "Continuing task. &gamma; &lt; 1 to keep the infinite-horizon return finite.",
    trap: "The agent is the <b>dispatcher</b>, not a passenger. People pressing buttons are stochastic environment events, not agent actions.",
  },
  {
    id: 5, title: "Warehouse inventory restocking", dom: "operations", diff: 2,
    q: "Decide how much of each product to reorder each day to meet demand without overstocking.",
    ctx: "A warehouse restocks products daily. <b>SKU</b> = a distinct product/item type. <b>Stockout</b> = running out of an item (lost sales). <b>Holding cost</b> = the cost of storing unsold inventory. <b>Lead time</b> = the delay between ordering and stock arriving.",
    state: "Current stock level per SKU, outstanding orders in transit, day of week / seasonality signals, recent demand history.",
    action: "Order quantity for each product this period (how many units to reorder).",
    reward: "+ from sales/profit, &minus; for holding cost and for stockouts (lost sales).",
    trans: "Depends on random customer demand + supplier lead times &rarr; unknown, stochastic.",
    disc: "Continuing. &gamma; encodes how much you value future profit vs immediate.",
    trap: "Demand has memory (trends, seasonality), so a raw single-day state isn't Markov: fold demand history / seasonal features into the state.",
  },
  {
    id: 6, title: "Real-time ad bidding", dom: "recsys", diff: 3,
    q: "For each incoming ad-impression auction, decide how much to bid, under a fixed daily budget.",
    ctx: "When you load a webpage, a split-second auction (real-time bidding) decides which advertiser's ad you see; each advertiser bids automatically in milliseconds. An <b>impression</b> = one chance to show an ad. A <b>conversion</b> = the user does the goal action (buys, signs up). A <b>bandit</b> is a simpler one-shot decision problem with no future consequences, contrasted here with the MDP.",
    state: "Remaining budget, time left in the day, features of the current impression (user, context, estimated value), pacing so far.",
    action: "The bid amount for this impression (or bid/no-bid).",
    reward: "+ for conversions/value won, &minus; for spend; net value under the budget constraint.",
    trans: "Whether you win depends on unknown competing bids; future impressions arrive stochastically &rarr; unknown.",
    disc: "Episode = one day (budget resets). &gamma; balances winning now vs saving budget for better later impressions.",
    trap: "The budget makes actions coupled over time: spending now removes future ability to bid. That temporal constraint is the whole reason it's an MDP and not a per-auction bandit.",
  },
  {
    id: 7, title: "Robotic arm grasping", dom: "robotics", diff: 2,
    q: "A robot arm must pick up an object from a bin.",
    ctx: "An industrial robot arm reaches into a bin and grabs an item. The <b>end-effector</b> is the 'hand'/gripper at the arm's tip. <b>Torque</b> = rotational force applied at a joint. <b>Reward shaping</b> = adding small intermediate rewards to guide learning, rather than only rewarding the final success.",
    state: "Joint angles/velocities of the arm, gripper state, camera image of the object's pose in the bin.",
    action: "Joint torques or target end-effector movements, plus open/close gripper (continuous control).",
    reward: "+ large for a successful lift, small shaping + for moving closer to the object, &minus; for collisions or dropping.",
    trans: "Contact physics is complex and hard to model exactly &rarr; learn in simulation or from real trials.",
    disc: "Episodic (one grasp attempt). &gamma; near 1 for the short horizon.",
    trap: "Reward shaping is the risk: naive shaping (e.g. reward for touching) can be hacked, e.g. the arm nudges the object forever without lifting.",
  },
  {
    id: 8, title: "Smart thermostat (HVAC)", dom: "control", diff: 1,
    q: "Control a building's heating/cooling to keep occupants comfortable while minimizing energy cost.",
    ctx: "<b>HVAC</b> = heating, ventilation, and air conditioning. A <b>setpoint</b> is the target temperature you tell the system to reach. <b>Thermal inertia</b> = rooms heat and cool slowly, so an action now shows its full effect only later.",
    state: "Current indoor temperature, outdoor temperature/weather, time of day, occupancy, recent temperature trend.",
    action: "HVAC setting: heat/cool/off, or target setpoint / power level.",
    reward: "&minus; for comfort deviation from target and &minus; for energy cost; trade the two off.",
    trans: "Building thermodynamics + weather: physical but effectively unknown and slow &rarr; model-free or learned model.",
    disc: "Continuing. &gamma; &lt; 1; matters because pre-cooling now saves energy later (delayed effect).",
    trap: "Thermal inertia means actions have delayed effects, so a myopic (&gamma;&asymp;0) agent oscillates. The temperature trend must be in the state for Markov-ness.",
  },
  {
    id: 9, title: "Portfolio allocation", dom: "finance", diff: 3,
    q: "Rebalance a portfolio across assets over time to grow wealth at acceptable risk.",
    ctx: "A <b>portfolio</b> is your mix of investments (stocks, bonds, cash). <b>Rebalancing</b> = adjusting the proportions over time. <b>Volatility</b> = how much prices swing (a risk measure). <b>Non-stationary</b> = the market's behavior itself changes over time, so old patterns may not hold.",
    state: "Current holdings/weights, cash, recent price/return history and volatility signals, market indicators.",
    action: "New target allocation across assets (buy/sell/hold amounts).",
    reward: "Risk-adjusted return, e.g. change in log-wealth penalized by volatility, minus transaction costs.",
    trans: "Future prices are stochastic and unknown (arguably non-stationary) &rarr; model-free, hard problem.",
    disc: "Continuing (or fixed horizon). &gamma; sets short-term vs long-term wealth focus.",
    trap: "Markov assumption is shaky: prices aren't fully determined by recent state, and the process is non-stationary. A strong answer flags this limitation rather than pretending it's clean.",
  },
  {
    id: 10, title: "Atari Breakout", dom: "games", diff: 1,
    q: "Learn to play the arcade game Breakout from raw pixels.",
    ctx: "Breakout is an old arcade game: a paddle at the bottom bounces a ball upward to smash rows of bricks; you move the paddle left/right. '<b>From raw pixels</b>' means the agent sees only the screen image, not the game's internal numbers. <b>DQN</b> is the famous deep-RL method that first solved these.",
    state: "A stack of the last few game frames (screen pixels). Stacking is what makes it Markov.",
    action: "Discrete joystick moves: left, right, no-op, fire.",
    reward: "Game score change: + when bricks are broken, 0 otherwise, effectively &minus; on losing the ball/life.",
    trans: "Deterministic game engine, but unknown to the agent &rarr; treated as model-free.",
    disc: "Episodic (one game/life). &gamma; slightly &lt; 1 (e.g. 0.99).",
    trap: "A single frame isn't Markov: it can't encode the ball's velocity/direction. Stacking 4 frames restores the Markov property. This is the canonical DQN setup.",
  },
  {
    id: 11, title: "Traffic light control", dom: "control", diff: 2,
    q: "Control signals at an intersection to minimize vehicle delay.",
    ctx: "Traffic lights at a junction. A <b>phase</b> is one configuration of which directions currently have green (green one way forces red on the crossing way). <b>Min-green time</b> = a safety rule forcing a light to stay green a minimum duration before switching.",
    state: "Queue lengths / vehicle counts per approach, current light phase, time in current phase.",
    action: "Which phase to switch to next, or whether to extend/switch the current green.",
    reward: "&minus; total waiting time / queue length across all approaches; minimize cumulative delay.",
    trans: "Vehicle arrivals are random and unknown &rarr; model-free.",
    disc: "Continuing. &gamma; &lt; 1; matters because clearing one direction now creates queues later.",
    trap: "The agent is the <b>signal controller</b>. Drivers arriving are the environment. Also min-green-time safety constraints shape the real action space.",
  },
  {
    id: 12, title: "Uber surge pricing", dom: "operations", diff: 3,
    q: "Set a price multiplier per area/time to balance rider demand and driver supply.",
    ctx: "When demand is high, ride apps raise fares (e.g. 1.5x) to attract more drivers and ration limited rides. <b>Supply</b> = available drivers in a zone; <b>demand</b> = open ride requests. Setting a price also nudges drivers to relocate and riders to wait, which changes the situation later.",
    state: "Current supply (available drivers) and demand (open requests) per zone, time, weather/events, recent price history.",
    action: "The price multiplier to set for each zone now.",
    reward: "+ from completed trips / marginal revenue and reduced wait, &minus; for unmet demand or driver idle.",
    trans: "Rider and driver responses to price are unknown and stochastic &rarr; model-free.",
    disc: "Continuing. &gamma; &gt; 0 because a price now shifts supply/demand in future steps.",
    trap: "Pricing now changes the future state (drivers relocate, riders defer), so it's sequential, not a one-shot pricing decision. That coupling is why it's an MDP.",
  },
  {
    id: 13, title: "Cache eviction policy", dom: "systems", diff: 2,
    q: "When the cache is full, decide which item to evict to maximize hit rate.",
    ctx: "A <b>cache</b> is a small, fast store holding a few items so they can be served quickly. When it's full and a new item arrives, you must <b>evict</b> (remove) one. A <b>hit</b> = the requested item was in the cache; a <b>miss</b> = it wasn't (slow fetch needed). Higher hit rate = better.",
    state: "Current cache contents with their recency/frequency stats, the incoming request, workload features.",
    action: "Which cached item to evict to make room (or don't cache the new item).",
    reward: "+1 on a cache hit, 0 (or &minus;) on a miss; maximize long-run hit rate.",
    trans: "Depends on the unknown future request stream &rarr; model-free.",
    disc: "Continuing. &gamma; &lt; 1; evicting affects future hits so it's not greedy.",
    trap: "Reward is delayed: an eviction's cost shows up only when that item is next requested. Credit assignment across the request stream is the core difficulty.",
  },
  {
    id: 14, title: "Datacenter cooling", dom: "control", diff: 2,
    q: "Adjust cooling equipment to keep servers safe while minimizing power use.",
    ctx: "Data centers are rooms full of servers that generate heat; <b>chillers, fans, and pumps</b> cool them, and overheating damages hardware. <b>Actuators</b> are the controllable cooling devices; a <b>setpoint</b> is a target value you command them to. This is a real system Google/DeepMind famously optimized.",
    state: "Temperatures across the facility, server load, outside weather, current pump/fan/chiller settings.",
    action: "Setpoints for cooling actuators (fan speeds, chilled-water setpoints, valves).",
    reward: "&minus; energy used, with a hard &minus; penalty for exceeding safe temperature limits.",
    trans: "Facility thermodynamics: complex, unknown &rarr; learned model / model-free.",
    disc: "Continuing. &gamma; near 1 due to slow thermal dynamics and delayed effects.",
    trap: "Safety constraints dominate: you can't freely explore actions that risk overheating, so real deployments use a learned safe controller, not raw trial-and-error.",
  },
  {
    id: 15, title: "Adaptive tutoring system", dom: "recsys", diff: 2,
    q: "Pick which exercise or lesson to give a student next to maximize learning.",
    ctx: "Learning software (think Duolingo) that chooses the next question based on how the student is doing. <b>Mastery</b> = how well the student knows a given skill. <b>Latent/hidden state</b> = the true knowledge level can't be observed directly, only guessed from answers, which is what makes it a POMDP (see below).",
    state: "Estimated mastery per skill (knowledge state), recent answer correctness, time spent, engagement signals.",
    action: "Which problem/lesson/difficulty to present next.",
    reward: "+ for demonstrated learning gains / correct answers on held-out checks, ideally long-term mastery and retention.",
    trans: "How a student's knowledge evolves is unknown and student-specific &rarr; model-free.",
    disc: "Episode = a session or course. &gamma; high, since real learning is a long-term outcome.",
    trap: "Reward hacking: optimizing immediate correctness makes it serve trivially easy problems. And the knowledge state is hidden/latent, so it's really a POMDP with an estimated belief over mastery.",
  },
  {
    id: 16, title: "Email send-time optimization", dom: "recsys", diff: 1,
    q: "Choose when to send each user a notification/email to maximize engagement.",
    ctx: "Deciding what time of day to send each user a marketing email or push notification so they're most likely to open it. <b>Engagement</b> = opens and clicks. <b>Unsubscribe/fatigue</b> = sending too often annoys users into opting out, a long-term cost.",
    state: "User's past open/click times, timezone, recent activity, days since last contact.",
    action: "The time (slot) to send the next message, or whether to send now vs wait.",
    reward: "+ for opens/clicks, &minus; for unsubscribes or ignores.",
    trans: "User's future openness is unknown &rarr; model-free.",
    disc: "Continuing per user. &gamma; &gt; 0 because sending now affects fatigue/openness later.",
    trap: "Over-sending is a long-horizon trap: each send raises short-term clicks but risks unsubscribes later, so a myopic agent burns the user. &gamma; must value the future.",
  },
  {
    id: 17, title: "CartPole balancing", dom: "control", diff: 1,
    q: "Balance a pole hinged on a cart by moving the cart left or right.",
    ctx: "The classic 'balance a broomstick on your palm' problem: a pole is hinged upright on a wheeled cart, and you push the cart left or right to stop the pole tipping over. <b>Angular velocity</b> = how fast the pole is rotating. It's the standard beginner RL benchmark.",
    state: "Cart position and velocity, pole angle and angular velocity (4 numbers).",
    action: "Push the cart left or right (discrete), or a continuous force.",
    reward: "+1 for every timestep the pole stays upright; episode ends when it falls.",
    trans: "Known-ish physics but treated as unknown by the learner &rarr; model-free benchmark.",
    disc: "Episodic (until failure/time limit). &gamma; near 1.",
    trap: "The state needs velocities, not just positions: angle alone isn't Markov because you can't tell which way the pole is falling without angular velocity.",
  },
  {
    id: 18, title: "Blackjack player", dom: "games", diff: 1,
    q: "Learn an optimal hit/stand policy for blackjack.",
    ctx: "Blackjack is a card game against a dealer: you want your cards to sum as close to 21 as possible without going over ('busting'). <b>Hit</b> = take another card; <b>stand</b> = stop. A <b>usable ace</b> is an ace counted as 11 without busting. The dealer's <b>showing card</b> is their one face-up card. A <b>sufficient statistic</b> = a compact summary that captures everything you need, so you can ignore the full card history.",
    state: "Player's current hand sum, whether holding a usable ace, dealer's showing card.",
    action: "Hit or stand (or double/split in the full game).",
    reward: "Terminal: +1 win, &minus;1 loss, 0 draw at the end of the hand.",
    trans: "Known card probabilities in principle, but classically solved model-free by playing hands.",
    disc: "Episodic (one hand). &gamma; = 1 typically since it's short and reward is terminal.",
    trap: "The compact 3-variable state is deliberately chosen to be Markov: it's a sufficient statistic, you don't need the full history of cards drawn (in the no-counting version).",
  },
  {
    id: 19, title: "Drug dosing for a patient", dom: "medical", diff: 3,
    q: "Adjust a medication dose over time to keep a patient in a healthy range.",
    ctx: "A system that tunes a patient's drug dose over time based on lab readings (e.g. insulin for blood sugar). A <b>biomarker</b> is a measurable health indicator (like blood glucose). <b>Offline/safe RL</b> = learning from past recorded data instead of experimenting on live patients, since risky exploration is not allowed.",
    state: "Recent measurements (e.g. blood levels, vitals), dosing history, patient covariates.",
    action: "The next dose to administer (amount / timing).",
    reward: "+ for keeping the target biomarker in range, &minus; for danger zones / side effects.",
    trans: "Patient physiology response is unknown, individual, and noisy &rarr; model-free, learned cautiously.",
    disc: "Continuing over the treatment course. &gamma; high for long-term health.",
    trap: "You only measure a noisy proxy of the true physiological state, so it's a POMDP. Plus you can't freely explore doses on real patients, which is why offline/safe RL is used here.",
  },
  {
    id: 20, title: "Cloud autoscaling", dom: "systems", diff: 2,
    q: "Decide how many server instances to run to handle web traffic cost-effectively.",
    ctx: "Cloud apps run on rented server <b>instances</b>; you add more when traffic rises and remove them to save money (<b>autoscaling</b>). <b>SLA</b> = a promised service level, e.g. response time under X ms. <b>Spin-up latency</b> = a new instance takes time to boot before it can serve requests.",
    state: "Current request rate, latency, CPU/memory utilization, number of running instances, time-of-day/trend.",
    action: "Scale up / down / hold: how many instances to add or remove.",
    reward: "&minus; for cost (instance-hours) and &minus; for SLA violations (high latency); minimize both.",
    trans: "Future traffic is unknown and spiky; instance spin-up has delay &rarr; model-free.",
    disc: "Continuing. &gamma; &gt; 0 because scaling decisions have delayed payoff (boot time).",
    trap: "Spin-up latency means an action taken now only helps a few steps later, so a greedy agent under-provisions before spikes. Trend features keep the state Markov.",
  },
  {
    id: 21, title: "Warehouse robot navigation", dom: "robotics", diff: 1,
    q: "A mobile robot must travel from its position to a target shelf on a warehouse grid.",
    ctx: "A robot drives across a grid of cells from a start square to a goal square, avoiding obstacles and other robots. A <b>gridworld</b> (a board of squares the agent steps through) is <i>the</i> canonical teaching example in RL, so the vocabulary here maps directly onto textbook problems.",
    state: "Robot's grid cell (and orientation), goal location, positions of obstacles / other robots.",
    action: "Move up/down/left/right (discrete grid moves), or velocity commands.",
    reward: "&minus;1 per step (to encourage speed), + on reaching goal, &minus; large for collisions.",
    trans: "Mostly deterministic on a static grid; stochastic if other robots move unpredictably.",
    disc: "Episodic (one trip). &gamma; &lt; 1, which combined with per-step &minus;1 yields shortest-path behavior.",
    trap: "This is the textbook gridworld. Note the reward design: the &minus;1-per-step cost is what makes the optimal policy prefer short paths, not any explicit distance term.",
  },
  {
    id: 22, title: "Wireless transmit-power control", dom: "systems", diff: 3,
    q: "A device adjusts its transmit power to maintain a good connection while saving battery and limiting interference.",
    ctx: "A wireless device (phone, IoT sensor) picks how strongly to transmit: stronger = clearer signal but more battery drain and more <b>interference</b> to other devices. <b>Channel quality</b> = how good the wireless link is right now; it fluctuates and can only be estimated noisily.",
    state: "Estimated channel quality, current power level, buffer/queue of data to send, battery level.",
    action: "Set transmit power level for the next slot.",
    reward: "+ for successful throughput, &minus; for energy used and for causing interference.",
    trans: "The wireless channel varies randomly and is only partially observed &rarr; unknown, stochastic.",
    disc: "Continuing. &gamma; &lt; 1 for the infinite-horizon return.",
    trap: "You never see the true channel, only a noisy estimate, so strictly it's a POMDP: the agent acts on a belief about channel state, not the state itself.",
  },
  {
    id: 23, title: "Poker (heads-up)", dom: "games", diff: 3,
    q: "Learn to play heads-up poker against an opponent.",
    ctx: "<b>Heads-up</b> = just two players. Each player has private cards only they can see; some cards (<b>the board</b>) are dealt face-up and shared. Actions: <b>fold</b> (quit the hand and forfeit), <b>call</b> (match the current bet), <b>check</b> (pass with no bet), <b>bet/raise</b> (put chips in). Crucially, you never see the two cards your opponent is holding, so information is <b>imperfect</b>.",
    state: "Your cards, the public/board cards, pot size, betting history, chip stacks. You do NOT see the opponent's cards.",
    action: "Fold, call, check, bet, or raise (with sizing).",
    reward: "Terminal: chips won or lost at the end of the hand.",
    trans: "Depends on random deals and the opponent's hidden, adaptive strategy &rarr; unknown.",
    disc: "Episodic (one hand). &gamma; &asymp; 1.",
    trap: "Hidden opponent cards mean the environment is <b>partially observable</b>, so this is a POMDP, not a clean MDP. That imperfect information is exactly why poker is harder than chess.",
  },
  {
    id: 24, title: "Battery storage arbitrage", dom: "finance", diff: 2,
    q: "Charge and discharge a grid battery to profit from fluctuating electricity prices.",
    ctx: "A large grid-connected battery buys and stores electricity when prices are low and sells (discharges) it when prices are high, pocketing the difference. <b>Arbitrage</b> = profiting from price gaps. <b>Battery wear</b> = repeated charging degrades the battery, a real cost. Prices vary through the day and are uncertain.",
    state: "Current battery charge level, current and recent electricity prices, time of day, demand/price forecast signals.",
    action: "Charge / discharge / idle, and at what rate this period.",
    reward: "+ revenue from discharging when prices are high, &minus; cost of charging (and battery wear).",
    trans: "Future prices are stochastic and unknown &rarr; model-free.",
    disc: "Continuing (or daily episodes). &gamma; &gt; 0 because storing energy now pays off later.",
    trap: "The charge level is a physical constraint linking actions over time: you can't discharge energy you didn't store. That inter-temporal coupling is the essence of the MDP here.",
  },
];
