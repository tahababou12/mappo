import { EntityType, RelationshipType } from '../types';
import theme from '../theme';

/**
 * Get the color for a node based on its entity type
 * @param type The entity type
 * @param isDarkMode Whether the app is in dark mode
 * @returns The color for the node
 */
export const getNodeColor = (type: EntityType, isDarkMode: boolean): string => {
  const entityColors = theme.colors.entityColors as Record<string, string>;
  return entityColors[type] || (isDarkMode ? '#718096' : '#A0AEC0');
};

/**
 * Get the color for a link based on its relationship type
 * @param type The relationship type
 * @param isDarkMode Whether the app is in dark mode
 * @returns The color for the link
 */
export const getLinkColor = (type: RelationshipType, isDarkMode: boolean): string => {
  const relationshipColors = theme.colors.relationshipColors as Record<string, string>;
  return relationshipColors[type] || (isDarkMode ? '#718096' : '#A0AEC0');
}; 