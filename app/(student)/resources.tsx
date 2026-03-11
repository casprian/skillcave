import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function ResourcesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'videos', 'articles', 'projects', 'tools'];

  const resources = [
    {
      id: 1,
      title: 'React Hooks Complete Guide',
      category: 'videos',
      duration: '2h 30m',
      level: 'Intermediate',
      author: 'Tech Academy',
      description: 'Master React Hooks with practical examples'
    },
    {
      id: 2,
      title: 'TypeScript Best Practices',
      category: 'articles',
      duration: '15 min read',
      level: 'Intermediate',
      author: 'Dev Insights',
      description: 'Learn TypeScript patterns used in production'
    },
    {
      id: 3,
      title: 'Build a Todo App with React',
      category: 'projects',
      duration: '3h 45m',
      level: 'Beginner',
      author: 'Code Masters',
      description: 'Step-by-step guide to build your first React app'
    },
    {
      id: 4,
      title: 'VS Code Productivity Hacks',
      category: 'tools',
      duration: '30 min',
      level: 'Beginner',
      author: 'Dev Tools',
      description: 'Essential VS Code extensions and shortcuts'
    },
    {
      id: 5,
      title: 'State Management Patterns',
      category: 'articles',
      duration: '20 min read',
      level: 'Advanced',
      author: 'Architecture Digest',
      description: 'Redux, Context API, and modern state management'
    },
    {
      id: 6,
      title: 'Advanced React Performance',
      category: 'videos',
      duration: '1h 45m',
      level: 'Advanced',
      author: 'Performance Lab',
      description: 'Optimize your React applications for speed'
    },
  ];

  const filteredResources = selectedCategory === 'all' 
    ? resources 
    : resources.filter(r => r.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      videos: '🎥',
      articles: '📄',
      projects: '🚀',
      tools: '🛠️'
    };
    return icons[category] || '📚';
  };

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'Beginner': return '#10b981';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#0369a1';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resources</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryPill,
                selectedCategory === cat && styles.categoryPillActive
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[
                styles.categoryPillText,
                selectedCategory === cat && styles.categoryPillTextActive
              ]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Resources Count */}
        <Text style={styles.resultsText}>
          {filteredResources.length} {selectedCategory === 'all' ? 'Resources' : selectedCategory}
        </Text>

        {/* Resources List */}
        <View style={styles.resourcesList}>
          {filteredResources.map((resource) => (
            <TouchableOpacity key={resource.id} style={styles.resourceCard}>
              <View style={styles.resourceHeader}>
                <View style={styles.resourceIcon}>
                  <Text style={styles.iconEmoji}>{getCategoryIcon(resource.category)}</Text>
                </View>
                <View style={styles.resourceTitleSection}>
                  <Text style={styles.resourceTitle} numberOfLines={2}>{resource.title}</Text>
                  <Text style={styles.resourceAuthor}>{resource.author}</Text>
                </View>
              </View>

              <Text style={styles.resourceDescription} numberOfLines={2}>
                {resource.description}
              </Text>

              <View style={styles.resourceFooter}>
                <View style={styles.resourceMeta}>
                  <View style={[styles.levelBadge, { backgroundColor: getLevelColor(resource.level) + '20' }]}>
                    <Text style={[styles.levelText, { color: getLevelColor(resource.level) }]}>
                      {resource.level}
                    </Text>
                  </View>
                  <Text style={styles.duration}>⏱️ {resource.duration}</Text>
                </View>
                <TouchableOpacity style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View →</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Total Resources</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>16</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>

        {/* Recommended Section */}
        <View style={styles.recommendedCard}>
          <Text style={styles.recommendedTitle}>⭐ Recommended for You</Text>
          <Text style={styles.recommendedText}>
            Based on your progress, we recommend:
          </Text>
          <Text style={styles.recommendedItem}>• Advanced React Performance Optimization</Text>
          <Text style={styles.recommendedItem}>• Building Scalable Applications</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#0369a1',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  backButton: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  categoryScroll: {
    marginBottom: 16,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  categoryPillActive: {
    backgroundColor: '#0369a1',
    borderColor: '#0369a1',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  categoryPillTextActive: {
    color: 'white',
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 14,
  },
  resourcesList: {
    marginBottom: 24,
  },
  resourceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  resourceHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  resourceIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 24,
  },
  resourceTitleSection: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 2,
  },
  resourceAuthor: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  resourceDescription: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 10,
    lineHeight: 18,
  },
  resourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  duration: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  viewButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ecf7ff',
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0369a1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e7ff',
  },
  recommendedCard: {
    backgroundColor: '#ecf7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
    borderRadius: 12,
    padding: 14,
  },
  recommendedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  recommendedText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 8,
  },
  recommendedItem: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 4,
  },
});
