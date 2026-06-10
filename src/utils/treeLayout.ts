import { Member } from '../types';

/**
 * Dynamically computes generations for all family members based on parent relationships.
 * Root ancestors (who don't have parents declared in the members list) receive generation 1.
 * Children of level G receive G+1.
 */
export function calculateGenerations(members: Member[]): Member[] {
  const memberMap = new Map<string, Member>();
  members.forEach(m => memberMap.set(m.id, { ...m, generasi: undefined }));

  // Helper to determine generation level recursively
  const getGeneration = (id: string, visited: Set<string>): number => {
    if (visited.has(id)) return 1; // Prevent infinite loops
    visited.add(id);

    const m = memberMap.get(id);
    if (!m) return 1;

    // If generation is already calculated, return it
    if (m.generasi !== undefined) return m.generasi;

    // Find parents
    const parent1 = m.ayahId ? memberMap.get(m.ayahId) : null;
    const parent2 = m.ibuId ? memberMap.get(m.ibuId) : null;

    let parentGen = 0;
    if (parent1) parentGen = Math.max(parentGen, getGeneration(parent1.id, new Set(visited)));
    if (parent2) parentGen = Math.max(parentGen, getGeneration(parent2.id, new Set(visited)));

    if (parentGen === 0) {
      // If of level 1 but has spouse with defined generation, match them
      if (m.pasanganId) {
        const spouse = memberMap.get(m.pasanganId);
        if (spouse && spouse.generasi !== undefined) {
          return spouse.generasi;
        }
      }
      return 1;
    }

    return parentGen + 1;
  };

  // Run calculation for all members
  members.forEach(m => {
    const visited = new Set<string>();
    const gen = getGeneration(m.id, visited);
    const updated = memberMap.get(m.id);
    if (updated) updated.generasi = gen;
  });

  // Second pass: Align married spouses' generation levels if one was calculated later
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 5) {
    changed = false;
    iterations++;
    memberMap.forEach((m) => {
      if (m.pasanganId) {
        const spouse = memberMap.get(m.pasanganId);
        if (spouse && spouse.generasi !== m.generasi) {
          const maxGen = Math.max(m.generasi || 1, spouse.generasi || 1);
          if (m.generasi !== maxGen) {
            m.generasi = maxGen;
            changed = true;
          }
          if (spouse.generasi !== maxGen) {
            spouse.generasi = maxGen;
            changed = true;
          }
        }
      }
    });
  }

  return Array.from(memberMap.values());
}

/**
 * Interface representing a node position on the SVG tree
 */
export interface TreeNode {
  member: Member;
  x: number;
  y: number;
  width: number;
  height: number;
  spouseNode?: TreeNode;
}

export interface TreeLink {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: 'parent-child' | 'marriage';
}

/**
 * Custom tree layout planner. Places generations horizontally/vertically.
 * Highly functional and simple to prevent overlapping and provide direct SVG nodes.
 */
export function buildTreeLayout(
  members: Member[],
  viewMode: 'vertical' | 'horizontal' = 'vertical'
): { nodes: TreeNode[]; links: TreeLink[] } {
  const membersWithGen = calculateGenerations(members);
  
  // Group members by generation
  const generationGroups: Record<number, Member[]> = {};
  membersWithGen.forEach(m => {
    const gen = m.generasi || 1;
    if (!generationGroups[gen]) generationGroups[gen] = [];
    generationGroups[gen].push(m);
  });

  const nodes: TreeNode[] = [];
  const links: TreeLink[] = [];
  
  const nodeWidth = 200;
  const nodeHeight = 85;
  const genSpacing = 160; // distance between generations
  const siblingSpacing = 240; // distance between sibling nodes/marriage pairs

  // To build marriages paired together, we'll keep track of placed nodes
  const placedMap = new Set<string>();

  const generations = Object.keys(generationGroups).map(Number).sort((a, b) => a - b);

  generations.forEach((gen) => {
    const genMembers = generationGroups[gen];
    const pairs: { primary: Member; spouse?: Member }[] = [];
    
    // Group spouses together in the placement order
    genMembers.forEach((m) => {
      if (placedMap.has(m.id)) return;

      const spouse = (m.pasanganId ? genMembers.find(s => s.id === m.pasanganId) : undefined) ||
                     genMembers.find(s => s.pasanganId === m.id);
      pairs.push({ primary: m, spouse });
      
      placedMap.add(m.id);
      if (spouse) placedMap.add(spouse.id);
    });

    const totalWidth = (pairs.length - 1) * siblingSpacing;
    const startOffset = -totalWidth / 2;

    pairs.forEach((pair, pairIndex) => {
      const basePos = startOffset + pairIndex * siblingSpacing;

      let x1 = 0;
      let y1 = 0;
      let x2 = 0;
      let y2 = 0;

      if (viewMode === 'vertical') {
        x1 = basePos;
        y1 = (gen - 1) * genSpacing;
        if (pair.spouse) {
          x1 = basePos - 110;
          x2 = basePos + 110;
          y2 = y1;
        }
      } else {
        // Horizontal orientation
        x1 = (gen - 1) * genSpacing;
        y1 = basePos;
        if (pair.spouse) {
          x1 = (gen - 1) * genSpacing;
          y1 = basePos - 60;
          x2 = x1;
          y2 = basePos + 60;
        }
      }

      // Add Primary Node
      const node1: TreeNode = {
        member: pair.primary,
        x: x1,
        y: y1,
        width: nodeWidth,
        height: nodeHeight,
      };
      nodes.push(node1);

      // Add Spouse Node
      if (pair.spouse) {
        const node2: TreeNode = {
          member: pair.spouse,
          x: x2,
          y: y2,
          width: nodeWidth,
          height: nodeHeight,
        };
        nodes.push(node2);
        node1.spouseNode = node2;
        node2.spouseNode = node1;

        // Draw marriage bridge link
        links.push({
          fromX: x1,
          fromY: y1,
          toX: x2,
          toY: y2,
          type: 'marriage',
        });
      }
    });
  });

  // Process Parent-to-Child links
  nodes.forEach((node) => {
    const child = node.member;
    const fatherId = child.ayahId;
    const motherId = child.ibuId;

    if (fatherId || motherId) {
      // Find parent nodes
      const fatherNode = fatherId ? nodes.find(n => n.member.id === fatherId) : null;
      const motherNode = motherId ? nodes.find(n => n.member.id === motherId) : null;

      let parentAnchorX = 0;
      let parentAnchorY = 0;
      let hasBoth = false;

      if (fatherNode && motherNode) {
        // Parents are married, anchor is middle of their marriage line
        parentAnchorX = (fatherNode.x + motherNode.x) / 2;
        parentAnchorY = (fatherNode.y + motherNode.y) / 2;
        hasBoth = true;
      } else if (fatherNode) {
        parentAnchorX = fatherNode.x;
        parentAnchorY = fatherNode.y;
      } else if (motherNode) {
        parentAnchorX = motherNode.x;
        parentAnchorY = motherNode.y;
      } else {
        return; // No parents found in nodes list
      }

      // Connect parent anchor to child top-left coordinates center
      links.push({
        fromX: parentAnchorX,
        fromY: parentAnchorY,
        toX: node.x,
        toY: node.y,
        type: 'parent-child',
      });
    }
  });

  return { nodes, links };
}
