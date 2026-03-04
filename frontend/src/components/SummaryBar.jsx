import { useAPI } from "../hooks/useAPI";
import { api } from "../utils/api";

export default function SummaryBar() {
  const { data, loading } = useAPI(api.summary);

  if (loading || !data) return <div className="summary-bar loading">Loading summary…</div>;

  const cards = [
    { label: "Countries tracked", value: data.n_countries },
    { label: "Mean Gini index", value: data.mean_gini?.toFixed(1) },
    { label: "Most unequal", value: data.most_unequal },
    { label: "Most equal", value: data.most_equal },
    { label: "Gini range", value: `${data.min_gini?.toFixed(1)} – ${data.max_gini?.toFixed(1)}` },
  ];

  return (
    <div className="summary-bar">
      {cards.map(c => (
        <div className="summary-card" key={c.label}>
          <span className="summary-value">{c.value}</span>
          <span className="summary-label">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
