import { BoundingBox, EnhancedBoundingBox, ObjectTypeMapping, ClassificationRule } from '@/types';

/**
 * Classify objects based on their dimensions using configurable rules
 */
export function classifyObjects(
  objects: BoundingBox[],
  typeMapping: ObjectTypeMapping
): EnhancedBoundingBox[] {
  const { classification_rules, manual_mappings = [] } = typeMapping;

  return objects.map((obj, index) => {
    // Check if there's a manual mapping for this index
    const manualMapping = manual_mappings.find((m) => m.index === index);

    if (manualMapping) {
      return enhanceBox(obj, index, manualMapping.type, manualMapping.type);
    }

    // Auto-classify based on rules
    const classifiedType = classifyByRules(obj, classification_rules.rules);
    const meshType = classifiedType || classification_rules.default.mesh;
    const type = classifiedType || classification_rules.default.type;

    return enhanceBox(obj, index, type, meshType);
  });
}

/**
 * Classify a single object based on classification rules
 */
function classifyByRules(obj: BoundingBox, rules: ClassificationRule[]): string | null {
  for (const rule of rules) {
    if (matchesRule(obj, rule)) {
      return rule.mesh;
    }
  }
  return null;
}

/**
 * Check if an object matches a classification rule
 */
function matchesRule(obj: BoundingBox, rule: ClassificationRule): boolean {
  const { conditions } = rule;
  const { width, height } = obj;

  // Calculate aspect ratio and dimensions
  const aspectRatio = width / height;
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);

  // Check width constraints
  if (conditions.min_width !== undefined && width < conditions.min_width) return false;
  if (conditions.max_width !== undefined && width > conditions.max_width) return false;

  // Check height constraints
  if (conditions.min_height !== undefined && height < conditions.min_height) return false;
  if (conditions.max_height !== undefined && height > conditions.max_height) return false;

  // Check dimension constraints
  if (conditions.min_dimension !== undefined && minDimension < conditions.min_dimension) return false;
  if (conditions.max_dimension !== undefined && maxDimension > conditions.max_dimension) return false;

  // Check aspect ratio constraints
  if (conditions.aspect_ratio_min !== undefined && aspectRatio < conditions.aspect_ratio_min) return false;
  if (conditions.aspect_ratio_max !== undefined && aspectRatio > conditions.aspect_ratio_max) return false;

  return true;
}

/**
 * Enhance a bounding box with center coordinates and type information
 */
function enhanceBox(
  box: BoundingBox,
  index: number,
  type: string,
  mesh: string
): EnhancedBoundingBox {
  return {
    ...box,
    centerX: box.x + box.width / 2,
    centerY: box.y + box.height / 2,
    index,
    type,
    mesh,
  };
}

/**
 * Get statistics about classified objects
 */
export function getClassificationStats(objects: EnhancedBoundingBox[]): Record<string, number> {
  const stats: Record<string, number> = {};

  for (const obj of objects) {
    stats[obj.type] = (stats[obj.type] || 0) + 1;
  }

  return stats;
}
