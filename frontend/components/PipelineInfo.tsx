"use client";

import { useState } from "react";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

export default function PipelineInfo() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="pipeline-math">
      <p className="text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
        Generate synthetic time series with controllable regime changes, then
        run a sliding-window persistent homology pipeline to detect topological
        anomalies.
      </p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-1.5 text-[11px] flex items-center gap-1 hover:opacity-70 transition-opacity"
        style={{ color: "var(--accent)" }}
      >
        <span className="text-[9px]">{expanded ? "\u25BC" : "\u25B6"}</span>
        {expanded ? "hide" : "show"} mathematical pipeline
      </button>

      {expanded && (
        <div className="mt-3 text-[11px] space-y-3">
          {/* Pipeline diagram — 2 lines */}
          <div>
            <div className="sec-label mb-1">Pipeline</div>
            <BlockMath
              math={String.raw`\begin{gathered} x(t) \xrightarrow{\text{window}} W_i \xrightarrow{\text{embed}} Q_i \subset \mathbb{R}^d \xrightarrow{D} \text{dist}(Q_i) \xrightarrow{\text{VR}} \mathcal{S}_i \\[6pt] \mathcal{S}_i \xrightarrow{\partial} D_i \xrightarrow{\text{reduce}} \text{pairs}_i \xrightarrow{\Sigma} F(i) \xrightarrow{\alpha} \text{anomalies} \end{gathered}`}
            />
          </div>

          {/* Takens */}
          <div>
            <div className="sec-label mb-1">Takens&apos; Delay Embedding</div>
            <p className="mb-1" style={{ color: "var(--foreground)" }}>
              Reconstruct attractor topology from scalar observations:
            </p>
            <BlockMath
              math={String.raw`\Phi_{\tau,d}(t) = \bigl(x(t),\; x(t+\tau),\; \ldots,\; x(t+(d-1)\tau)\bigr)`}
            />
          </div>

          {/* Distance matrix */}
          <div>
            <div className="sec-label mb-1">Distance Matrix</div>
            <BlockMath
              math={String.raw`D_{ij} = d(p_i, p_j), \quad D \in \mathbb{R}^{N \times N}`}
            />
          </div>

          {/* VR complex */}
          <div>
            <div className="sec-label mb-1">Vietoris-Rips Complex</div>
            <p className="mb-1" style={{ color: "var(--foreground)" }}>
              A simplex{" "}
              <InlineMath math={String.raw`\sigma`} /> enters at{" "}
              <InlineMath math={String.raw`\epsilon = \text{diam}(\sigma)`} />:
            </p>
            <BlockMath
              math={String.raw`\text{VR}_\epsilon(P) = \bigl\{\sigma \subseteq \{1,\ldots,N\} : \max_{\{i,j\} \subseteq \sigma} D_{ij} \leq \epsilon\bigr\}`}
            />
          </div>

          {/* Boundary operator */}
          <div>
            <div className="sec-label mb-1">Boundary Operator</div>
            <p className="mb-1" style={{ color: "var(--foreground)" }}>
              Over{" "}
              <InlineMath math={String.raw`\mathbb{Z}/2\mathbb{Z}`} />:
            </p>
            <BlockMath
              math={String.raw`\partial_k[v_0, \ldots, v_k] = \sum_{i=0}^{k} [v_0, \ldots, \hat{v}_i, \ldots, v_k]`}
            />
          </div>

          {/* Column reduction */}
          <div>
            <div className="sec-label mb-1">Column Reduction</div>
            <p style={{ color: "var(--foreground)" }}>
              Reduce so no two columns share pivot{" "}
              <InlineMath
                math={String.raw`\text{low}(j) = \max\{i : D_{ij}=1\}`}
              />
              . Pivot pair{" "}
              <InlineMath math={String.raw`(i,j)`} />{" "}
              <InlineMath math={String.raw`\Rightarrow`} />{" "}
              birth-death{" "}
              <InlineMath
                math={String.raw`[f(\sigma_i), f(\sigma_j)]`}
              />.
            </p>
          </div>

          {/* Anomaly */}
          <div>
            <div className="sec-label mb-1">Anomaly Detection</div>
            <BlockMath
              math={String.raw`|F_k(i) - \bar{F}_k| > \alpha \cdot s_k`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
