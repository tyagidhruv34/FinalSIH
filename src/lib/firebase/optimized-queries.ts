// Optimized Firebase query helpers for better performance
import { collection, query, orderBy, limit, where, QueryConstraint } from 'firebase/firestore';
import { db } from './firebase';

export const createOptimizedQuery = (
  collectionName: string,
  constraints: QueryConstraint[] = [],
  maxResults: number = 20
) => {
  const baseConstraints = [
    orderBy('timestamp', 'desc'),
    limit(maxResults),
    ...constraints
  ];
  return query(collection(db, collectionName), ...baseConstraints);
};

// Pre-configured optimized queries
export const optimizedQueries = {
  alerts: (maxResults = 20) => createOptimizedQuery('alerts', [], maxResults),
  recentAlerts: (maxResults = 10) => createOptimizedQuery('alerts', [], maxResults),
  userStatuses: (maxResults = 50) => createOptimizedQuery('user_status', [], maxResults),
  helpRequests: (maxResults = 30) => createOptimizedQuery(
    'user_status',
    [where('status', '==', 'help')],
    maxResults
  ),
  resourceNeeds: (maxResults = 30) => createOptimizedQuery(
    'resource_needs',
    [where('fulfilled', '==', false)],
    maxResults
  ),
  damageReports: (maxResults = 20) => createOptimizedQuery('damage_reports', [], maxResults),
};

