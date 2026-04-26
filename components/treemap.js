import React from "react";
import { treemap, hierarchy, scaleOrdinal, schemeDark2, treemapSliceDice } from "d3";

function cleanName(name) {
  return String(name).replace(/\s*:\s*/g, ": ");
}

function getValueOnly(name) {
  const cleaned = cleanName(name);
  return cleaned.includes(":") ? cleaned.split(":")[1].trim() : cleaned;
}

function labelWithAttribute(name, depth, attributes) {
  const cleaned = cleanName(name);

  if (cleaned.includes(":")) {
    return cleaned;
  }

  const attrName = attributes && attributes[depth - 1];
  return attrName ? `${attrName}: ${cleaned}` : cleaned;
}

function sortOrder(name) {
  const value = getValueOnly(name);

  const order = {
    Female: 0,
    Male: 1,
    Other: 2,
    No: 0,
    Yes: 1,
    0: 0,
    1: 1,
  };

  return order[value] ?? 99;
}

function Text({ d, attributes }) {
  const width = d.x1 - d.x0;
  const height = d.y1 - d.y0;

  if (height < 20) return null;

  const percent = d.parent
    ? ((d.value / d.parent.value) * 100).toFixed(1)
    : "100.0";

  const label = labelWithAttribute(d.data.name, d.depth, attributes);

  const fontSize = width < 55 ? 10 : 11;
  const lineGap = fontSize + 5;

  return (
    <text
      x={d.x0 + 3}
      y={d.y0 + fontSize + 4}
      fill="white"
      pointerEvents="none"
    >
        <tspan x={d.x0 + 3} fontSize={9}>
            {label}
        </tspan>

        <tspan
            x={d.x0 + 3}
            dy={lineGap-5}
            fontSize={9}
        >   
  {`Value: ${percent}%`}
</tspan>
    </text>
  );
}

function LargeLabel({ d, attributes }) {
  const width = d.x1 - d.x0;
  const height = d.y1 - d.y0;

  if (width < 25 || height < 25) return null;

  const cx = (d.x0 + d.x1) / 2;
  const cy = (d.y0 + d.y1) / 2;

  const shouldRotate = height > width;
  const boxSize = Math.min(width, height);
  const fontSize = Math.max(8, Math.min(30, boxSize / 5));

  const label = labelWithAttribute(d.data.name, d.depth, attributes);

  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={fontSize}
      fontWeight="bold"
      fill="black"
      opacity={0.25}
      transform={shouldRotate ? `rotate(90, ${cx}, ${cy})` : undefined}
      pointerEvents="none"
    >
      {label}
    </text>
  );
}

export function TreeMap(props) {
  const { margin, svg_width, svg_height, tree, attributes } = props;

  const innerWidth = svg_width - margin.left - margin.right;
  const innerHeight = svg_height - margin.top - margin.bottom;

  const legendHeight = 24;

  const root = hierarchy(tree)
    .sum(d => (d.children ? 0 : d.value))
    .sort((a, b) => sortOrder(a.data.name) - sortOrder(b.data.name));

  treemap()
    .tile(treemapSliceDice)
    .size([innerWidth, innerHeight - legendHeight])
    .paddingInner(2)
    .paddingOuter(2)
    .round(true)(root);

  const leaves = root.leaves();

  const colorKeys = [...new Set(leaves.map(d => d.parent?.data.name || "root"))];
  const color = scaleOrdinal(schemeDark2).domain(colorKeys);

  return (
    <svg
      viewBox={`0 0 ${svg_width} ${svg_height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
    >
      <style>
        {`
          .treemap-rect:hover {
            fill: #ff5452 !important;
          }
        `}
      </style>

      <g transform={`translate(${margin.left - 40}, ${margin.top - 40})`}>
        {/* Legend */}
        <g>
          {colorKeys.map((key, i) => {
            const matchingLeaf = leaves.find(d => (d.parent?.data.name || "root") === key);
            const depth = matchingLeaf?.parent?.depth || 1;

            return (
              <g key={key} transform={`translate(${i * 170}, 0)`}>
                <rect width={18} height={18} fill={color(key)} />
                <text x={25} y={14} fontSize={14}>
                  {key === "root"
                    ? "undefined: root"
                    : labelWithAttribute(key, depth, attributes)}
                </text>
              </g>
            );
          })}
        </g>

        {/* Treemap */}
        <g transform={`translate(0, ${legendHeight})`}>
          {leaves.map((d, i) => {
            const colorKey = d.parent?.data.name || "root";

            return (
              <g key={i}>
                <rect
                  className="treemap-rect"
                  x={d.x0}
                  y={d.y0}
                  width={d.x1 - d.x0}
                  height={d.y1 - d.y0}
                  fill={color(colorKey)}
                  stroke="none"
                />
                <Text d={d} attributes={attributes} />
              </g>
            );
          })}

          {/* Black border only around first filter split */}
          {root.children &&
            root.children.map((d, i) => (
              <rect
                key={`border-${i}`}
                x={d.x0}
                y={d.y0}
                width={d.x1 - d.x0}
                height={d.y1 - d.y0}
                fill="none"
                stroke="black"
                strokeWidth={1}
                pointerEvents="none"
              />
            ))}

          {/* Large background labels */}
          {root.children &&
            root.children.map((d, i) => (
              <LargeLabel key={`large-${i}`} d={d} attributes={attributes} />
            ))}
        </g>
      </g>
    </svg>
  );
}