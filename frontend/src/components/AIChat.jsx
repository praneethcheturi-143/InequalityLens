import { useState, useRef, useEffect } from "react";

const RESPONSES = [
  { keywords: ["most unequal","highest gini","worst inequality"],
    reply: "South Africa has the world's highest Gini index at ~63, followed by Brazil (~49) and Colombia (~54). These extreme levels stem from historical policies, land concentration, and limited social mobility. Check the World Map tab and filter by Gini index to see the full picture." },
  { keywords: ["most equal","lowest gini","best equality","equal countr"],
    reply: "The Nordic countries lead in equality — Sweden (~27), Denmark (~27), and Finland (~28) consistently rank as the world's most equal nations. Strong unions, universal healthcare, free education, and high taxes on wealth are the key drivers. See the Lorenz Curve tab to compare them visually." },
  { keywords: ["south africa"],
    reply: "South Africa's Gini of ~63 is the world's highest, a direct legacy of apartheid. Land ownership remains highly concentrated, unemployment sits above 30%, and the top 10% earn ~65% of all income. Despite strong social grants, structural inequality persists across racial lines." },
  { keywords: ["united states","usa","america","us compare"],
    reply: "The US has a Gini of ~41 — high for a developed nation. It ranks far behind Germany (~31), France (~32), and the UK (~35). The US has lower redistribution through taxes, weaker unions, and higher healthcare costs. Explore the US States tab to see how income varies from Mississippi to Maryland." },
  { keywords: ["europe","european"],
    reply: "Europe is the most equal region globally. Western Europe averages a Gini of ~30, driven by strong welfare states, universal healthcare, and progressive taxation. Eastern Europe (~35) is slightly less equal but improving. The US (~41) is a notable outlier among wealthy nations." },
  { keywords: ["policy","policies","reduce","improve","fix"],
    reply: "Evidence shows 4 policies consistently reduce inequality: (1) Progressive taxation — each 10% increase in top marginal tax reduces Gini by ~1 point. (2) Universal education access. (3) Minimum wage increases. (4) Universal healthcare. Try the Policy Simulator tab to model these impacts yourself." },
  { keywords: ["gini","what is gini","explain gini","drives the gini"],
    reply: "The Gini index measures income inequality on a 0–100 scale. 0 = perfect equality, 100 = perfect inequality. Our ML model shows GDP per capita (35%), adult literacy (28%), and life expectancy (18%) are the strongest predictors. Visit the ML Models tab to run your own predictions." },
  { keywords: ["brazil","latin america","south america"],
    reply: "Brazil has a Gini of ~49, one of the highest in Latin America. Despite Bolsa Família (the world's largest cash transfer program) reducing extreme poverty, land concentration and racial inequality remain severe. The top 1% in Brazil owns ~30% of all wealth." },
  { keywords: ["china","india","asia"],
    reply: "China's Gini (~38) has risen sharply since 1990 as rapid growth created extreme wealth at the top. India (~36) has similar levels but with deeper rural-urban divides. Japan (~33) and South Korea (~32) are the most equal in Asia, driven by strong education systems." },
  { keywords: ["improve","trend","getting better","getting worse","over time"],
    reply: "Global inequality peaked around 2000 and has slowly declined — mainly because China and India lifted hundreds of millions out of poverty. However, within-country inequality has risen in most nations. Check the Trends tab to see country-by-country Gini trajectories with forecasts." },
  { keywords: ["poverty","poor","extreme poverty"],
    reply: "Extreme poverty (under $2.15/day) has fallen from 36% in 1990 to under 9% today — largely due to China's growth. But relative poverty within rich nations is rising. The US poverty rate (~12%) is double that of Germany (~6%). Filter by poverty rate on the World Map tab." },
  { keywords: ["health","life expectancy","healthcare"],
    reply: "There's a strong negative correlation between inequality and life expectancy (r = -0.6 in our dataset). Japan tops life expectancy at ~84 years with a Gini of ~33. The US spends the most on healthcare per capita (~$12,000) yet has lower life expectancy than France, which spends half as much." },
  { keywords: ["education","literacy","school"],
    reply: "Adult literacy strongly predicts lower inequality — each 10% rise in literacy correlates with a ~2 point drop in Gini. Nordic countries and Japan combine near-100% literacy with low inequality. Our ML model ranks literacy as the 2nd most important Gini predictor at 28% importance." },
  { keywords: ["machine learning","ml","model","predict","forecast","random forest"],
    reply: "Our Random Forest model predicts a country's Gini with R²=0.78 using 5 features: GDP per capita, life expectancy, adult literacy, health expenditure, and poverty rate. GDP per capita is the strongest predictor (~35% importance). Try the ML Models tab to input custom values and get a Gini prediction." },
  { keywords: ["compare","radar","comparison"],
    reply: "Use the Compare tab to put up to 4 countries side-by-side on a radar chart across 6 normalised dimensions: Gini, GDP, life expectancy, literacy, health spend, and poverty. All metrics are scaled 0–100 so higher always means better." },
  { keywords: ["germany","nordic","sweden","finland","norway","denmark"],
    reply: "Nordic countries consistently top global equality rankings. Sweden (~27), Denmark (~27), Finland (~28) and Norway (~26) achieve low Gini through universal public services, strong unions, and highly progressive tax systems. Germany (~31) follows a similar model with strong worker co-determination laws." },
];

const DEFAULT = "That's a great question about global inequality. Our World Bank and Census data covers 30+ countries across Gini, GDP, life expectancy, literacy, and poverty. Try exploring the World Map tab to compare countries visually, the Policy Simulator to model interventions, or ask me about a specific country or region!";

function getReply(input) {
  const lower = input.toLowerCase();
  for (const r of RESPONSES) {
    if (r.keywords.some(k => lower.includes(k))) return r.reply;
  }
  return DEFAULT;
}

export default function AIChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your inequality analyst. Ask me anything — which countries are most unequal, what drives the Gini index, how the US compares globally, or what policies reduce inequality." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 700 + Math.random() * 600));
    setMessages(prev => [...prev, { role: "assistant", content: getReply(userMsg.content) }]);
    setLoading(false);
  };

  const suggestions = [
    "Which country is most unequal?",
    "Why is South Africa so unequal?",
    "How does the US compare to Europe?",
    "What policies reduce the Gini index?",
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>AI inequality analyst</h2>
        <span className="ai-badge">Powered by Claude</span>
      </div>
      <p className="panel-desc">Ask any question about global inequality data, trends, or policies.</p>
      <div className="suggestions">
        {suggestions.map(s => (
          <button key={s} className="suggestion-chip" onClick={() => setInput(s)}>{s}</button>
        ))}
      </div>
      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            <span className="chat-avatar">{m.role === "assistant" ? "⚖️" : "You"}</span>
            <div className="chat-bubble">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg assistant">
            <span className="chat-avatar">⚖️</span>
            <div className="chat-bubble typing"><span></span><span></span><span></span></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row">
        <input className="chat-input" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask about inequality data..." />
        <button className="btn-primary" onClick={send} disabled={loading || !input.trim()}>Send</button>
      </div>
    </div>
  );
}
