import React, { useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import ForceGraph2D from "react-force-graph-2d";

interface Character {
  id: string;
  name: string;
  parents: string[];
  symbol: string;
  charMetadata: string;
}

interface BloodlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
}

interface GraphNode {
  id: string;
  name: string;
  character: Character;
  metadata: any;
  level: number;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: "parent";
}

const BloodlineModal: React.FC<BloodlineModalProps> = ({
  isOpen,
  onClose,
  characters,
}) => {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper function to get character metadata
  const getCharacterMetadata = (character: Character) => {
    try {
      return JSON.parse(character.charMetadata);
    } catch (error) {
      return { description: "Description not available", image: null };
    }
  };

  // Build the graph data structure
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const levels: { [key: string]: number } = {};
    const visited = new Set<string>();

    // Helper function to check if character has valid parents
    const hasValidParents = (character: Character) => {
      return character.parents.some(
        (parentId) => parentId !== "0x0000000000000000000000000000000000000000"
      );
    };

    // First, find all root characters (no parents or only null parents)
    const rootCharacters = characters.filter((char) => !hasValidParents(char));
    rootCharacters.forEach((char) => {
      levels[char.id] = 0;
      visited.add(char.id);
    });

    // Build the tree level by level
    let currentLevel = 0;
    while (visited.size < characters.length) {
      const currentLevelChars = characters.filter(
        (char) => levels[char.id] === currentLevel
      );

      for (const char of currentLevelChars) {
        // Find all children of this character
        const children = characters.filter(
          (child) => child.parents.includes(char.id) && !visited.has(child.id)
        );

        children.forEach((child) => {
          levels[child.id] = currentLevel + 1;
          visited.add(child.id);
        });
      }

      currentLevel++;
    }

    // Create nodes
    characters.forEach((char) => {
      const level = levels[char.id] || 0;
      const metadata = getCharacterMetadata(char);

      // Calculate initial position based on level and index
      const charsInLevel = characters.filter(
        (c) => (levels[c.id] || 0) === level
      );
      const indexInLevel = charsInLevel.findIndex((c) => c.id === char.id);
      const levelWidth = 1500; // Increased from 800 to 1200
      const levelHeight = 350; // Increased from 200 to 350

      nodes.push({
        id: char.id,
        name: char.name,
        character: char,
        metadata,
        level,
        x: indexInLevel * 600 + 200, // Increased from 300 to 500, and offset from 150 to 200
        y: level * levelHeight + 200, // Increased offset from 150 to 200
      });
    });

    // Create links (parent-child relationships)
    characters.forEach((char) => {
      char.parents.forEach((parentId) => {
        if (parentId !== "0x0000000000000000000000000000000000000000") {
          links.push({
            source: parentId, // Parent is the source
            target: char.id, // Child is the target
            type: "parent",
          });
        }
      });
    });

    return { nodes, links };
  }, [characters]);

  // Custom node renderer
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const nodeSize = 30 / globalScale; // Fixed size for circular nodes
      const centerX = node.x;
      const centerY = node.y;

      // Draw circular background
      ctx.beginPath();
      ctx.arc(centerX, centerY, nodeSize, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fill();

      // Draw circular border
      ctx.strokeStyle = "#5CA4A3";
      ctx.lineWidth = 3 / globalScale;
      ctx.stroke();

      // Draw character image if available
      if (node.metadata && node.metadata.image) {
        // Check if we already have a cached image for this node
        if (!node._cachedImage) {
          const img = new (window as any).Image();
          img.onload = () => {
            node._cachedImage = img;
            // Trigger a redraw of just this node
            if (node.__threeObj) {
              node.__threeObj.__forceGraph.emitParticle(node);
            }
          };
          img.src = node.metadata.image;
        }

        // Draw the cached image if available
        if (node._cachedImage) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, nodeSize, 0, 2 * Math.PI);
          ctx.clip();

          // Calculate aspect ratio to fit image properly
          const img = node._cachedImage;
          const aspectRatio = img.width / img.height;
          let drawWidth = nodeSize * 2;
          let drawHeight = nodeSize * 2;

          if (aspectRatio > 1) {
            // Image is wider than tall
            drawHeight = drawWidth / aspectRatio;
          } else {
            // Image is taller than wide
            drawWidth = drawHeight * aspectRatio;
          }

          const offsetX = (nodeSize * 2 - drawWidth) / 2;
          const offsetY = (nodeSize * 2 - drawHeight) / 2;

          ctx.drawImage(
            img,
            centerX - nodeSize + offsetX,
            centerY - nodeSize + offsetY,
            drawWidth,
            drawHeight
          );
          ctx.restore();
        }
      } else {
        // Draw placeholder if no image
        ctx.fillStyle = "#e5e7eb";
        ctx.beginPath();
        ctx.arc(centerX, centerY, nodeSize * 0.6, 0, 2 * Math.PI);
        ctx.fill();

        // Draw question mark
        ctx.fillStyle = "#6b7280";
        ctx.font = `${nodeSize * 0.8}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", centerX, centerY);
      }

      // Draw character name below the node
      const label = node.name;
      const fontSize = 10 / globalScale;
      ctx.font = `${fontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#333333";

      // Add background for text readability
      const textWidth = ctx.measureText(label).width;
      const textHeight = fontSize;
      const textPadding = 4 / globalScale;

      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(
        centerX - textWidth / 2 - textPadding,
        centerY + nodeSize + 2,
        textWidth + textPadding * 2,
        textHeight + textPadding * 2
      );

      // Draw text
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, centerX, centerY + nodeSize + textPadding + 2);
    },
    []
  );

  // Node size getter
  const nodeRelSize = 12;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-black/50"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-scroll border border-gray-200">
        {/* Modal Header */}
        <div className="bg-[#5CA4A3] text-white px-6 py-4 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-white hover:text-blue-100 transition-colors duration-200 text-2xl font-bold"
          >
            ×
          </button>
          <h2 className="text-2xl font-bold text-center">
            Bloodline Connections
          </h2>
          <p className="text-center text-blue-100 mt-1">
            Interactive family tree of {characters.length} characters
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Force Graph */}
            <div className="flex justify-center">
              <div
                ref={containerRef}
                className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50 h-[70vh] w-full max-w-4xl"
              >
                <ForceGraph2D
                  ref={graphRef}
                  graphData={graphData}
                  nodeLabel="name"
                  nodeCanvasObject={nodeCanvasObject}
                  nodeRelSize={nodeRelSize}
                  linkColor={() => "#5CA4A3"}
                  linkWidth={2}
                  linkDirectionalArrowLength={6}
                  linkDirectionalArrowRelPos={1}
                  linkDirectionalParticles={0}
                  cooldownTicks={100}
                  onEngineStop={() => {
                    // Graph has finished positioning
                  }}
                  width={1500}
                  height={600}
                  backgroundColor="#f9fafb"
                />
              </div>
            </div>

            {/* Character Details */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodlineModal;
