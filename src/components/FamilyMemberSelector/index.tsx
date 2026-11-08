import React from 'react';
import {View, Text, ScrollView, Pressable, StyleSheet} from 'react-native';
import {Plus} from 'lucide-react-native';
import useColors from '../../lib/hooks/useColors';

type Props = {
  members: Reminder.FamilyMember[];
  activeId: string;
  onSelect: (id: string) => void;
  onAddPress: () => void;
};

const FamilyMemberSelector = ({
  members,
  activeId,
  onSelect,
  onAddPress,
}: Props) => {
  const colors = useColors();

  if (members.length <= 1) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {members.map(member => {
        const isActive = member.id === activeId;
        const initial = member.name.charAt(0).toUpperCase();

        return (
          <Pressable
            key={member.id}
            onPress={() => onSelect(member.id)}
            style={styles.item}>
            <View
              style={[
                styles.avatarOuter,
                isActive && {
                  borderWidth: 2,
                  borderColor: colors.$brandActive,
                },
              ]}>
              <View
                style={[styles.avatar, {backgroundColor: member.avatarColor}]}>
                <Text style={styles.initial}>{initial}</Text>
              </View>
            </View>
            <Text
              style={[
                styles.name,
                {
                  color: isActive ? colors.$textPrimary : colors.$textSecondary,
                },
              ]}
              numberOfLines={1}>
              {member.name}
            </Text>
          </Pressable>
        );
      })}
      <Pressable onPress={onAddPress} style={styles.item}>
        <View style={styles.avatarOuter}>
          <View
            style={[
              styles.avatar,
              styles.addAvatar,
              {
                backgroundColor: colors.$surface,
                borderColor: colors.$border,
              },
            ]}>
            <Plus size={16} color={colors.$textSecondary} strokeWidth={1.5} />
          </View>
        </View>
        <Text style={[styles.name, {color: colors.$textSecondary}]}>
          Goshmak
        </Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 12,
  },
  item: {
    alignItems: 'center',
    maxWidth: 56,
  },
  avatarOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAvatar: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  initial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 11,
    marginTop: 4,
  },
});

export default FamilyMemberSelector;
