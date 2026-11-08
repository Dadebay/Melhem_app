import React, {useMemo} from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {ChevronRight, Edit3, Star, UserPlus} from 'lucide-react-native';
import {ListGroup, Separator} from 'heroui-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';
import reminderStore from '../../lib/store/reminderStore';
import {useShallow} from 'zustand/react/shallow';

type Props = NativeStackScreenProps<Nav.Reminder, 'FamilyMembers'>;

const FamilyMembersScreen = ({navigation}: Props) => {
  const {t} = useTranslation();
  const colors = useColors();

  const getRelationshipLabel = (rel: Reminder.Relationship): string => {
    const labels: Record<Reminder.Relationship, string> = {
      self: t('family.self'),
      child: t('family.child'),
      parent: t('family.parent'),
      spouse: t('family.spouse'),
      other: t('family.other'),
    };
    return labels[rel];
  };

  const {familyMembers, medications} = reminderStore(
    useShallow(state => ({
      familyMembers: state.familyMembers,
      medications: state.medications,
    })),
  );

  const memberMedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const med of medications) {
      if (med.isActive) {
        counts[med.memberId] = (counts[med.memberId] ?? 0) + 1;
      }
    }
    return counts;
  }, [medications]);

  const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}>
      <ListGroup>
        {familyMembers.map((member, index) => (
          <React.Fragment key={member.id}>
            {index > 0 && <Separator className="mx-4" />}
            <ListGroup.Item
              onPress={() =>
                navigation.navigate('MedicationsList', {memberId: member.id})
              }>
              <ListGroup.ItemPrefix>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: member.avatarColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: '#FFFFFF',
                    }}>
                    {getInitial(member.name)}
                  </Text>
                </View>
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '500',
                        color: colors.$textPrimary,
                      }}>
                      {member.name}
                    </Text>
                    {member.relationship === 'self' && (
                      <Star
                        size={14}
                        color={colors.$warning}
                        fill={colors.$warning}
                        strokeWidth={1.5}
                      />
                    )}
                  </View>
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {getRelationshipLabel(member.relationship)}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                  <Pressable
                    onPress={() =>
                      navigation.navigate('AddFamilyMember', {
                        memberId: member.id,
                      })
                    }
                    hitSlop={8}>
                    <Edit3
                      size={16}
                      color={colors.$textSecondary}
                      strokeWidth={1.5}
                    />
                  </Pressable>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.$textSecondary,
                    }}>
                    {memberMedCounts[member.id] ?? 0} {t('family.medications')}
                  </Text>
                  <ChevronRight
                    size={16}
                    color={colors.$textSecondary}
                    strokeWidth={1.5}
                  />
                </View>
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </React.Fragment>
        ))}

        <Separator className="mx-4" />

        {/* Add new member */}
        <ListGroup.Item
          onPress={() => navigation.navigate('AddFamilyMember', {})}>
          <ListGroup.ItemPrefix>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.$surface,
                borderWidth: 1.5,
                borderColor: colors.$border,
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <UserPlus
                size={20}
                color={colors.$textSecondary}
                strokeWidth={1.5}
              />
            </View>
          </ListGroup.ItemPrefix>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle>{t('family.addMember')}</ListGroup.ItemTitle>
          </ListGroup.ItemContent>
        </ListGroup.Item>
      </ListGroup>

      <Text
        style={{
          fontSize: 12,
          color: colors.$textSecondary,
          textAlign: 'center',
          padding: 16,
        }}>
        {t('family.hint')}
      </Text>
    </ScrollView>
  );
};

export default FamilyMembersScreen;
