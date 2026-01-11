import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MemoryMapNode } from '../types';
import { Move } from 'lucide-react';

interface Props {
  data: MemoryMapNode;
}

const MemoryMap: React.FC<Props> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const width = wrapper.clientWidth;
    const height = 500;
    
    const svg = d3.select(svgRef.current)
        .attr("width", width)
        .attr("height", height)
        .style("background-color", "#ffffff")
        .style("cursor", "grab");
        
    svg.selectAll("*").remove();

    // Group for content that will be zoomed
    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Tree Layout
    const root = d3.hierarchy(data);
    // Increase size for better spacing
    const treeLayout = d3.tree<MemoryMapNode>().size([height * 1.5, width * 0.8]); 
    treeLayout(root);

    // Initial positioning
    const initialTransform = d3.zoomIdentity.translate(80, height / 2 - (height * 1.5)/2 + 50).scale(0.8);
    svg.call(zoom.transform, initialTransform);

    // Links
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-width", 1.5)
      .attr("d", d3.linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x)
      );

    // Nodes
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", d => `node ${d.children ? "node--internal" : "node--leaf"}`)
      .attr("transform", d => `translate(${d.y},${d.x})`);

    // Node circles
    node.append("circle")
      .attr("r", 5)
      .attr("fill", d => d.children ? "#0f172a" : "#ffffff")
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 2);

    // Node Labels
    node.append("text")
      .attr("dy", "0.32em")
      .attr("x", d => (d.children ? -10 : 10))
      .attr("text-anchor", d => (d.children ? "end" : "start"))
      .text(d => d.data.label)
      .style("font-family", "Inter, sans-serif")
      .style("font-size", "13px")
      .style("font-weight", "500")
      .style("fill", "#1e293b")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 4px white");

  }, [data]);

  return (
    <div ref={wrapperRef} className="w-full h-[400px] overflow-hidden bg-white rounded-xl border border-gray-200 relative group">
      <div className="absolute top-3 left-3 z-10 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
        <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-md text-[10px] uppercase font-bold text-gray-400 border border-gray-100 shadow-sm flex items-center gap-1">
            <Move className="w-3 h-3" /> Drag & Zoom
        </span>
      </div>
      <svg ref={svgRef} className="w-full h-full block active:cursor-grabbing" />
    </div>
  );
};

export default MemoryMap;