import { ref, computed } from "vue";
import { Items as itemsData } from "@/data/items";
import { Formulas as formulasData } from "@/data/formula";
import { Actions as actionsData } from "@/data/actions";
import { Techs as techsData } from "@/data/techs";
import { Maps as mapsData } from "@/data/maps";
import { Eras as erasData } from "@/data/eras";
import { isArray } from "@/utils/is";

// Type-safe eras reference
const ERAS_LIST = erasData as any[];

// Milestone to Era mapping
const MILESTONE_ERA_MAP: Record<string, string> = {};
ERAS_LIST.forEach(era => {
  if (era.milestones) {
    era.milestones.forEach((m: any) => {
      MILESTONE_ERA_MAP[m.key] = era.key;
    });
  }
});

function getMaxEra(era1?: string, era2?: string): string | undefined {
  if (!era1) return era2;
  if (!era2) return era1;
  
  const idx1 = ERAS_LIST.findIndex(e => e.key === era1);
  const idx2 = ERAS_LIST.findIndex(e => e.key === era2);
  
  // If either is not found, keep the other
  if (idx1 === -1) return era2;
  if (idx2 === -1) return era1;
  
  return idx1 >= idx2 ? era1 : era2;
}

export interface TreeNode {
  type: 'item' | 'formula' | 'action' | 'tech';
  key: string;
  name: string;
  quantity: number;
  multiplier?: number;
  children: TreeNode[];
  note?: string;
  summary?: string;
  availableMethods?: { key: string; name: string; type: 'formula' | 'action' }[];
  selectedMethodKey?: string;
  maps?: string[];
  era?: string;
}

export function useProductionTree(pathOverrides: any) {
  const totalTechs = ref<Set<string>>(new Set());
  const globalProcessedTechs = new Set<string>();

  function resolveItem(itemKey: string, count: number, visited: Set<string>): TreeNode {
    const item = itemsData.find(i => i.key === itemKey);
    
    // Initial era from required_era or milestone
    let initialEra = (item as any)?.required_era;
    if (!initialEra && (item as any)?.milestone) {
      initialEra = MILESTONE_ERA_MAP[(item as any).milestone];
    }

    const node: TreeNode = {
      type: 'item',
      key: itemKey,
      name: item?.name || itemKey,
      quantity: count,
      children: [],
      era: initialEra
    };

    const formulas = (formulasData as any[]).filter(f => f.products.some((p: any) => p.key === itemKey));
    const actions = (actionsData as any[]).filter(a => a.rewards.some((r: any) => r.key === itemKey));
    
    node.availableMethods = [
      ...actions.map(a => ({ key: a.key, name: `行动: ${a.name}`, type: 'action' as const })),
      ...formulas.map(f => ({ key: f.key, name: `配方: ${f.name}`, type: 'formula' as const }))
    ];

    let bestAction = null;
    let bestFormula = null;

    const overrideKey = pathOverrides.value[itemKey];
    if (overrideKey) {
      bestAction = actions.find(a => a.key === overrideKey);
      bestFormula = !bestAction ? formulas.find(f => f.key === overrideKey) : null;
      node.selectedMethodKey = overrideKey;
    }

    if (!bestAction && !bestFormula) {
      bestAction = actions[0];
      bestFormula = bestAction ? null : formulas[0];
      node.selectedMethodKey = bestAction?.key || bestFormula?.key;
    }

    if (visited.has(itemKey)) {
      node.note = "(已折叠 - 循环引用)";
      return node;
    }
    const nextVisited = new Set(visited);
    nextVisited.add(itemKey);

    if (visited.size > 12) {
      node.note = "(已达到最大深度)";
      return node;
    }

    if (bestFormula) {
      const f = bestFormula;
      const p = f.products.find((p: any) => p.key === itemKey)!;
      const multiple = p.multiple || 1;
      const executions = Math.ceil(count / multiple);
      
      const requiredByReward = (p as any).required_item;
      const rewardReqs = requiredByReward ? (Array.isArray(requiredByReward) ? requiredByReward : [requiredByReward]) : [];

      const formulaNode: TreeNode = {
        type: 'formula',
        key: f.key,
        name: `配方: ${f.name}`,
        quantity: executions,
        multiplier: multiple,
        children: [],
        era: f.required_era
      };

      const summaryParts: string[] = [];
      if (f.required_techs) {
        for (const tKey of f.required_techs) {
          const tNode = resolveTech(tKey, nextVisited);
          formulaNode.children.push(tNode);
          formulaNode.era = getMaxEra(formulaNode.era, tNode.era);
        }
      }
      if (f.required_actions) {
        const ras = Array.isArray(f.required_actions) ? f.required_actions : [f.required_actions];
        for (const ra of ras) {
          const raKey = typeof ra === 'string' ? ra : ra.key;
          const raMin = typeof ra === 'object' ? ra.min || 1 : 1;
          const action = (actionsData as any[]).find(a => a.key === raKey);
          if (action) {
            const aNode = resolveAction(action, itemKey, executions * raMin, nextVisited);
            formulaNode.children.push(aNode);
            formulaNode.era = getMaxEra(formulaNode.era, aNode.era);
          }
        }
      }
      if (f.required_container) {
        const containerItem = itemsData.find(i => i.key === f.required_container);
        summaryParts.push(`${containerItem?.name || f.required_container} x1`);
        const cNode = resolveItem(f.required_container, 1, nextVisited);
        formulaNode.children.push(cNode);
        formulaNode.era = getMaxEra(formulaNode.era, cNode.era);
      }
      if (f.required_items) {
        for (const ri of f.required_items) {
          let riKey = Array.isArray(ri.key) ? ri.key[0] : ri.key;

          // If the product requires a specific material, and it's one of the choices in this slot, use it
          if (rewardReqs.length > 0) {
            if (Array.isArray(ri.key)) {
              const match = ri.key.find((k: string) => rewardReqs.includes(k));
              if (match) riKey = match;
            } else if (rewardReqs.includes(ri.key)) {
              riKey = ri.key;
            }
          }

          const riItem = itemsData.find(i => i.key === riKey);
          const total = executions * (ri.quantity || 1);
          summaryParts.push(`${riItem?.name || riKey} x${total}`);
          const riNode = resolveItem(riKey, total, nextVisited);
          formulaNode.children.push(riNode);
          formulaNode.era = getMaxEra(formulaNode.era, riNode.era);
        }
      }
      if (summaryParts.length) formulaNode.summary = summaryParts.join(', ');
      node.children.push(formulaNode);
      node.era = getMaxEra(node.era, formulaNode.era);
    } else if (bestAction) {
      const aNode = resolveAction(bestAction, itemKey, count, nextVisited);
      node.children.push(aNode);
      node.era = getMaxEra(node.era, aNode.era);
    }

    return node;
  }

  function resolveAction(a: any, targetItemKey: string, count: number, visited: Set<string>): TreeNode {
    const rw = a.rewards.find((r: any) => r.key === targetItemKey)!;
    const prob = ((rw as any).probability || 1000) / 1000;
    const qty = isArray((rw as any).quantity) ? (rw as any).quantity[0] : (rw as any).quantity || 1;
    const executions = Math.ceil(count / (qty * prob));

    const actionNode: TreeNode = {
      type: 'action',
      key: a.key,
      name: `行动: ${a.name}`,
      quantity: executions,
      multiplier: qty,
      children: [],
      era: rw.required_era
    };

    if (visited.has(`action:${a.key}`)) {
      actionNode.note = "(已折叠)";
      return actionNode;
    }
    const nextVisited = new Set(visited);
    nextVisited.add(`action:${a.key}`);

    const requiredByReward = (rw as any).required_item;
    const rewardReqs = requiredByReward ? (Array.isArray(requiredByReward) ? requiredByReward : [requiredByReward]) : [];

    // Add map info
    if (rw.map) {
      const mapKeys = rw.map.map((m: any) => typeof m === 'string' ? m : m.key);
      actionNode.maps = mapKeys.map((k: string) => {
        const m = (mapsData as any[]).find(md => md.key === k);
        return m?.name || k;
      });
    }

    const summaryParts: string[] = [];
    if (a.required_techs) {
      for (const tKey of a.required_techs) {
        const tNode = resolveTech(tKey, nextVisited);
        actionNode.children.push(tNode);
        actionNode.era = getMaxEra(actionNode.era, tNode.era);
      }
    }
    if (a.required_items) {
      for (const ri of a.required_items) {
        let riKey = Array.isArray(ri.key) ? ri.key[0] : ri.key;
        
        // If the reward requires a specific material, and it's one of the choices in this slot, use it
        if (rewardReqs.length > 0) {
          if (Array.isArray(ri.key)) {
            const match = ri.key.find((k: string) => rewardReqs.includes(k));
            if (match) riKey = match;
          } else if (rewardReqs.includes(ri.key)) {
            riKey = ri.key;
          }
        }

        const riItem = itemsData.find(i => i.key === riKey);
        const total = executions * (ri.quantity || 1);
        summaryParts.push(`${riItem?.name || riKey} x${total}`);
        const riNode = resolveItem(riKey, total, nextVisited);
        actionNode.children.push(riNode);
        actionNode.era = getMaxEra(actionNode.era, riNode.era);
      }
    }
    if (summaryParts.length) actionNode.summary = summaryParts.join(', ');
    return actionNode;
  }

  function resolveTech(techKey: string, visited: Set<string>): TreeNode {
    totalTechs.value.add(techKey);
    const tech = (techsData as any[]).find(t => t.key === techKey);
    
    // Tech era from required_era or milestone
    let initialEra = tech?.required_era;
    if (!initialEra && tech?.milestone) {
      initialEra = MILESTONE_ERA_MAP[tech.milestone];
    }

    const node: TreeNode = {
      type: 'tech',
      key: techKey,
      name: tech?.name || techKey,
      quantity: 1,
      children: [],
      era: initialEra
    };

    if (globalProcessedTechs.has(techKey)) {
      node.summary = "(已在别处统计其材料需求)";
      // Attempt to get era from dependencies even if summarized
      if (tech?.required_items) {
        for (const ri of tech.required_items) {
          const riKey = Array.isArray(ri.key) ? ri.key[0] : ri.key;
          const riItem = itemsData.find(i => i.key === riKey);
          let riEra = (riItem as any)?.required_era;
          if (!riEra && (riItem as any)?.milestone) riEra = MILESTONE_ERA_MAP[(riItem as any).milestone];
          node.era = getMaxEra(node.era, riEra);
        }
      }
      return node;
    }
    globalProcessedTechs.add(techKey);

    if (visited.has(`tech:${techKey}`)) {
      node.note = "(已折叠)";
      return node;
    }
    const nextVisited = new Set(visited);
    nextVisited.add(`tech:${techKey}`);

    if (tech?.required_items) {
      for (const ri of tech.required_items) {
        const riKey = Array.isArray(ri.key) ? ri.key[0] : ri.key;
        const riNode = resolveItem(riKey, ri.quantity || 1, nextVisited);
        node.children.push(riNode);
        node.era = getMaxEra(node.era, riNode.era);
      }
    }
    if (tech?.required_techs) {
      for (const tKey of tech.required_techs) {
        const tNode = resolveTech(tKey, nextVisited);
        node.children.push(tNode);
        node.era = getMaxEra(node.era, tNode.era);
      }
    }
    return node;
  }

  return {
    resolveItem,
    totalTechs,
    globalProcessedTechs
  };
}
