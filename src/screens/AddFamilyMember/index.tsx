import React, {useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {Users, Baby, UserCheck, Heart, User} from 'lucide-react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import useColors from '../../lib/hooks/useColors';
import reminderStore from '../../lib/store/reminderStore';

type Props = NativeStackScreenProps<Nav.Reminder, 'AddFamilyMember'>;

const AVATAR_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
];

type RelationshipOption = {
  value: Reminder.Relationship;
  label: string;
  icon: React.ElementType;
};

const RELATIONSHIP_ICONS: Record<Reminder.Relationship, React.ElementType> = {
  self: Users,
  child: Baby,
  parent: UserCheck,
  spouse: Heart,
  other: User,
};

const AddFamilyMemberScreen = ({route, navigation}: Props) => {
  const {t} = useTranslation();
  const colors = useColors();

  const ALL_RELATIONSHIPS: RelationshipOption[] = [
    {value: 'self', label: t('family.self'), icon: RELATIONSHIP_ICONS.self},
    {value: 'child', label: t('family.child'), icon: RELATIONSHIP_ICONS.child},
    {
      value: 'parent',
      label: t('family.parent'),
      icon: RELATIONSHIP_ICONS.parent,
    },
    {
      value: 'spouse',
      label: t('family.spouse'),
      icon: RELATIONSHIP_ICONS.spouse,
    },
    {value: 'other', label: t('family.other'), icon: RELATIONSHIP_ICONS.other},
  ];

  const memberId = route.params?.memberId;
  const existingMember = memberId
    ? reminderStore.getState().familyMembers.find(m => m.id === memberId)
    : undefined;
  const isEditing = !!existingMember;

  const [name, setName] = useState(existingMember?.name ?? '');
  const [relationship, setRelationship] = useState<Reminder.Relationship>(
    existingMember?.relationship ?? 'child',
  );
  const [avatarColor, setAvatarColor] = useState(
    existingMember?.avatarColor ?? '#3B82F6',
  );

  const addFamilyMember = reminderStore(state => state.addFamilyMember);
  const updateFamilyMember = reminderStore(state => state.updateFamilyMember);
  const removeFamilyMember = reminderStore(state => state.removeFamilyMember);

  const availableRelationships = ALL_RELATIONSHIPS.filter(r => {
    if (r.value === 'self') {
      return isEditing && existingMember?.relationship === 'self';
    }
    return true;
  });

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }
    if (isEditing && memberId) {
      updateFamilyMember(memberId, {
        name: name.trim(),
        relationship,
        avatarColor,
      });
    } else {
      addFamilyMember({
        name: name.trim(),
        relationship,
        avatarColor,
      });
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(t('family.removeMember'), t('family.removeConfirm'), [
      {text: t('common.no'), style: 'cancel'},
      {
        text: t('common.yes'),
        style: 'destructive',
        onPress: () => {
          if (memberId) {
            removeFamilyMember(memberId);
          }
          navigation.goBack();
        },
      },
    ]);
  };

  const initial = name.trim() ? name.trim().charAt(0).toUpperCase() : '?';

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 40,
        gap: 24,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      {/* Avatar preview */}
      <View style={{alignItems: 'center'}}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: avatarColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{fontSize: 28, fontWeight: '700', color: '#FFFFFF'}}>
            {initial}
          </Text>
        </View>
      </View>

      {/* Color picker */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 10,
        }}>
        {AVATAR_COLORS.map(color => {
          const isSelected = color === avatarColor;
          return (
            <Pressable
              key={color}
              onPress={() => setAvatarColor(color)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: isSelected ? 2 : 0,
                borderColor: colors.$background,
              }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: color,
                  borderWidth: isSelected ? 2 : 0,
                  borderColor: '#FFFFFF',
                }}
              />
            </Pressable>
          );
        })}
      </View>

      {/* Name input */}
      <View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.$textPrimary,
            marginBottom: 8,
          }}>
          {t('family.name')}
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('family.namePlaceholder')}
          placeholderTextColor={colors.$textDisabled}
          style={{
            backgroundColor: colors.$surface,
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
            color: colors.$textPrimary,
          }}
        />
      </View>

      {/* Relationship selector */}
      <View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.$textPrimary,
            marginBottom: 8,
          }}>
          {t('family.relationship')}
        </Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
          {availableRelationships.map(rel => {
            const isActive = rel.value === relationship;
            const IconComponent = rel.icon;
            return (
              <Pressable
                key={rel.value}
                onPress={() => setRelationship(rel.value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: isActive
                    ? colors.$brandActive
                    : colors.$surface,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}>
                <IconComponent
                  size={18}
                  color={isActive ? '#FFFFFF' : colors.$textSecondary}
                  strokeWidth={1.5}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: isActive ? '#FFFFFF' : colors.$textPrimary,
                  }}>
                  {rel.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Save button */}
      <Pressable
        onPress={handleSave}
        disabled={!name.trim()}
        style={{
          backgroundColor: name.trim()
            ? colors.$brandActive
            : colors.$textDisabled,
          borderRadius: 12,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{fontSize: 16, fontWeight: '600', color: '#FFFFFF'}}>
          {t('common.save')}
        </Text>
      </Pressable>

      {/* Delete button */}
      {isEditing && existingMember?.relationship !== 'self' && (
        <Pressable
          onPress={handleDelete}
          style={{alignItems: 'center', paddingVertical: 8}}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: colors.$error,
            }}>
            {t('family.removeMember')}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
};

export default AddFamilyMemberScreen;
