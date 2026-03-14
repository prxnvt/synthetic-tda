export const PLOTLY_LAYOUT_DEFAULTS: Partial<Plotly.Layout> = {
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  font: {
    family: "var(--font-geist-sans), system-ui, sans-serif",
    size: 11,
    color: "#334155",
  },
  xaxis: {
    gridcolor: "#e2e8f0",
    zerolinecolor: "#cbd5e1",
    linecolor: "#cbd5e1",
  },
  yaxis: {
    gridcolor: "#e2e8f0",
    zerolinecolor: "#cbd5e1",
    linecolor: "#cbd5e1",
  },
  hoverlabel: {
    bgcolor: "#1e293b",
    bordercolor: "#334155",
    font: { color: "#f8fafc", size: 11, family: "var(--font-geist-mono), monospace" },
  },
};

export const PLOTLY_CONFIG: Partial<Plotly.Config> = {
  responsive: true,
  displayModeBar: false,
};
