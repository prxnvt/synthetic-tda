export const PLOTLY_LAYOUT_DEFAULTS: Partial<Plotly.Layout> = {
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  font: {
    family: "var(--font-geist-sans), system-ui, sans-serif",
    size: 11,
    color: "#e2e8f0",
  },
  xaxis: {
    gridcolor: "#21262d",
    zerolinecolor: "#30363d",
    linecolor: "#30363d",
  },
  yaxis: {
    gridcolor: "#21262d",
    zerolinecolor: "#30363d",
    linecolor: "#30363d",
  },
  hoverlabel: {
    bgcolor: "#1e293b",
    bordercolor: "#30363d",
    font: { color: "#f8fafc", size: 11, family: "var(--font-geist-mono), monospace" },
  },
};

export const PLOTLY_CONFIG: Partial<Plotly.Config> = {
  responsive: true,
  displayModeBar: false,
};
