import React, {useState, useEffect, useRef} from 'react';
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import useColors from '../../lib/hooks/useColors';
import {useTranslation} from 'react-i18next';

type Props = {
  visible: boolean;
  initialTime: string; // "HH:mm"
  onConfirm: (time: string) => void;
  onCancel: () => void;
};

const TimePickerModal = ({
  visible,
  initialTime,
  onConfirm,
  onCancel,
}: Props) => {
  const colors = useColors();
  const {t} = useTranslation();
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const minutesRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      const [h, m] = initialTime.split(':');
      setHours(h ?? '08');
      setMinutes(m ?? '00');
    }
  }, [visible, initialTime]);

  const handleConfirm = () => {
    const h = Math.max(0, Math.min(23, parseInt(hours, 10) || 0));
    const m = Math.max(0, Math.min(59, parseInt(minutes, 10) || 0));
    const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onConfirm(time);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={s.overlay} onPress={onCancel}>
        <Pressable
          style={[s.card, {backgroundColor: colors.$surface}]}
          onPress={e => e.stopPropagation()}>
          <Text style={[s.title, {color: colors.$textPrimary}]}>
            {t('addMedication.timePromptTitle')}
          </Text>
          <View style={s.inputRow}>
            <TextInput
              style={[
                s.input,
                {
                  color: colors.$textPrimary,
                  backgroundColor: colors.$background,
                },
              ]}
              value={hours}
              onChangeText={text => {
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
                setHours(cleaned);
                if (cleaned.length === 2) {
                  minutesRef.current?.focus();
                }
              }}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="08"
              placeholderTextColor={colors.$textPlaceholder}
              selectTextOnFocus
            />
            <Text style={[s.colon, {color: colors.$textPrimary}]}>:</Text>
            <TextInput
              ref={minutesRef}
              style={[
                s.input,
                {
                  color: colors.$textPrimary,
                  backgroundColor: colors.$background,
                },
              ]}
              value={minutes}
              onChangeText={text =>
                setMinutes(text.replace(/[^0-9]/g, '').slice(0, 2))
              }
              keyboardType="number-pad"
              maxLength={2}
              placeholder="00"
              placeholderTextColor={colors.$textPlaceholder}
              selectTextOnFocus
            />
          </View>
          <View style={s.buttons}>
            <Pressable
              onPress={onCancel}
              style={[s.btn, {backgroundColor: colors.$background}]}>
              <Text style={[s.btnText, {color: colors.$textSecondary}]}>
                {t('addMedication.cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={[s.btn, {backgroundColor: colors.$brandActive}]}>
              <Text style={[s.btnText, {color: colors.$brandActiveText}]}>
                {t('addMedication.confirm')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 300,
    gap: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  input: {
    width: 64,
    height: 56,
    borderRadius: 12,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  colon: {
    fontSize: 28,
    fontWeight: '700',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default TimePickerModal;
