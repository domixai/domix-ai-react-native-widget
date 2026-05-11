/* eslint-disable */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, FlatList, Switch } from 'react-native';
import Modal from 'react-native-modal';
import { useDomix } from '../DomixProvider';

const PreChatForm = ({ onComplete }) => {
  const { config, identifyUser } = useDomix();
  const allFields = config?.pre_chat_form_options?.pre_chat_fields || [];
  const fields = allFields.filter(f => f.enabled);
  
  const primaryColor = config?.widget_color || '#00CE7C';
  const preChatMessage = config?.pre_chat_form_options?.pre_chat_message || 'Please fill in the form below to start.';

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeListField, setActiveListField] = useState(null);
  const [activeDateField, setActiveDateField] = useState(null);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    fields.forEach(field => {
      const value = formData[field.name];
      if (field.required && (value === undefined || value === null || String(value).trim().length === 0)) {
        newErrors[field.name] = 'This field is required';
      } else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[field.name] = 'Invalid email address';
      } else if (field.type === 'link' && value && !/^(http|https):\/\/[^ "]+$/.test(value)) {
        newErrors[field.name] = 'Invalid URL (include http/https)';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const userPayload = {
        name: formData.full_name || formData.name,
        email: formData.email,
        phone_number: formData.phone_number,
        custom_attributes: { ...formData }
      };
      
      Object.keys(userPayload).forEach(key => {
        if (userPayload[key] === undefined || userPayload[key] === '') {
          delete userPayload[key];
        }
      });
      
      await identifyUser(userPayload);
      onComplete();
    } catch (err) {
      console.error('Domix SDK: PreChatForm submission failed', err);
    } finally {
      setLoading(false);
    }
  };

  const renderFieldInput = (field) => {
    const value = formData[field.name];

    switch (field.type) {
      case 'list':
        return (
          <TouchableOpacity 
            style={[styles.input, styles.listButton, errors[field.name] && styles.inputError]}
            onPress={() => setActiveListField(field)}
            activeOpacity={0.7}
          >
            <Text style={[styles.listButtonText, !value && styles.placeholderText]}>
              {value || field.placeholder || `Select ${field.label.toLowerCase()}`}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        );

      case 'date':
        return (
          <TouchableOpacity 
            style={[styles.input, styles.listButton, errors[field.name] && styles.inputError]}
            onPress={() => setActiveDateField(field)}
            activeOpacity={0.7}
          >
            <Text style={[styles.listButtonText, !value && styles.placeholderText]}>
              {value || field.placeholder || 'Select Date'}
            </Text>
            <Text style={styles.dropdownIcon}>📅</Text>
          </TouchableOpacity>
        );

      case 'checkbox':
        return (
          <View style={styles.checkboxWrapper}>
            <Switch
              trackColor={{ false: "#E5E7EB", true: primaryColor + '80' }}
              thumbColor={value ? primaryColor : "#F3F4F6"}
              onValueChange={(val) => handleInputChange(field.name, val)}
              value={!!value}
            />
            <Text style={styles.checkboxLabel}>{field.placeholder || 'I agree'}</Text>
          </View>
        );

      case 'number':
        return (
          <TextInput
            style={[styles.input, errors[field.name] && styles.inputError]}
            placeholder={field.placeholder || '0'}
            placeholderTextColor="#9CA3AF"
            value={formData[field.name] || ''}
            onChangeText={(val) => handleInputChange(field.name, val)}
            keyboardType="numeric"
          />
        );

      case 'link':
        return (
          <TextInput
            style={[styles.input, errors[field.name] && styles.inputError]}
            placeholder={field.placeholder || 'https://example.com'}
            placeholderTextColor="#9CA3AF"
            value={formData[field.name] || ''}
            onChangeText={(val) => handleInputChange(field.name, val)}
            keyboardType="url"
            autoCapitalize="none"
          />
        );

      default: // text, email, phone_number
        return (
          <TextInput
            style={[styles.input, errors[field.name] && styles.inputError]}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            placeholderTextColor="#9CA3AF"
            value={formData[field.name] || ''}
            onChangeText={(val) => handleInputChange(field.name, val)}
            keyboardType={field.type === 'email' ? 'email-address' : field.type === 'phone_number' ? 'phone-pad' : 'default'}
            autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
            autoCorrect={false}
          />
        );
    }
  };

  // Date Picker Components
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const arr = [];
    for (let i = currentYear; i >= currentYear - 100; i--) arr.push(i);
    return arr;
  }, []);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const days = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= 31; i++) arr.push(i);
    return arr;
  }, []);

  const [dateSelection, setDateSelection] = useState({ day: 1, month: 0, year: new Date().getFullYear() });

  const confirmDate = () => {
    const day = dateSelection.day < 10 ? `0${dateSelection.day}` : dateSelection.day;
    const month = (dateSelection.month + 1) < 10 ? `0${dateSelection.month + 1}` : dateSelection.month + 1;
    const dateStr = `${dateSelection.year}-${month}-${day}`;
    handleInputChange(activeDateField.name, dateStr);
    setActiveDateField(null);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>{preChatMessage}</Text>
        
        {fields.map((field) => (
          <View key={field.name} style={styles.fieldContainer}>
            {field.type !== 'checkbox' && (
              <View style={styles.labelRow}>
                <Text style={styles.label}>{field.label}</Text>
                {field.required && <Text style={styles.requiredMark}>*</Text>}
              </View>
            )}
            {renderFieldInput(field)}
            {errors[field.name] && <Text style={styles.errorText}>{errors[field.name]}</Text>}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: primaryColor }, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>{loading ? 'Connecting...' : 'Start Chat'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* List Selection Modal */}
      <Modal
        isVisible={!!activeListField}
        onBackdropPress={() => setActiveListField(null)}
        style={styles.modal}
        backdropOpacity={0.4}
        useNativeDriverForBackdrop
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{activeListField?.label}</Text>
            <TouchableOpacity onPress={() => setActiveListField(null)}>
              <Text style={styles.closeModal}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={activeListField?.values || []}
            keyExtractor={(item) => (item.value || item).toString()}
            renderItem={({ item }) => {
              const itemLabel = item.label || item;
              const itemValue = item.value || item;
              const isSelected = formData[activeListField?.name] === itemValue;
              
              return (
                <TouchableOpacity 
                  style={[styles.listItem, isSelected && { backgroundColor: primaryColor + '10' }]}
                  onPress={() => {
                    handleInputChange(activeListField.name, itemValue);
                    setActiveListField(null);
                  }}
                >
                  <Text style={[styles.listItemText, isSelected && { color: primaryColor, fontWeight: '700' }]}>
                    {itemLabel}
                  </Text>
                  {isSelected && <Text style={{ color: primaryColor }}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      {/* Date Selection Modal */}
      <Modal
        isVisible={!!activeDateField}
        onBackdropPress={() => setActiveDateField(null)}
        style={styles.modal}
        backdropOpacity={0.4}
        useNativeDriverForBackdrop
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <TouchableOpacity onPress={confirmDate}>
              <Text style={[styles.closeModal, { color: primaryColor }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.datePickerBody}>
            <View style={styles.datePickerColumn}>
              <Text style={styles.datePickerLabel}>Day</Text>
              <FlatList
                data={days}
                keyExtractor={(i) => i.toString()}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={[styles.dateItem, dateSelection.day === item && styles.dateItemSelected]} 
                    onPress={() => setDateSelection(prev => ({...prev, day: item}))}
                  >
                    <Text style={[styles.dateItemText, dateSelection.day === item && { color: primaryColor }]}>{item}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>

            <View style={styles.datePickerColumn}>
              <Text style={styles.datePickerLabel}>Month</Text>
              <FlatList
                data={months}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item, index}) => (
                  <TouchableOpacity 
                    style={[styles.dateItem, dateSelection.month === index && styles.dateItemSelected]} 
                    onPress={() => setDateSelection(prev => ({...prev, month: index}))}
                  >
                    <Text style={[styles.dateItemText, dateSelection.month === index && { color: primaryColor }]}>{item}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>

            <View style={styles.datePickerColumn}>
              <Text style={styles.datePickerLabel}>Year</Text>
              <FlatList
                data={years}
                keyExtractor={(i) => i.toString()}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={[styles.dateItem, dateSelection.year === item && styles.dateItemSelected]} 
                    onPress={() => setDateSelection(prev => ({...prev, year: item}))}
                  >
                    <Text style={[styles.dateItemText, dateSelection.year === item && { color: primaryColor }]}>{item}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 32, lineHeight: 24 },
  fieldContainer: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  requiredMark: { color: '#EF4444', marginLeft: 4, fontWeight: 'bold' },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 16, fontSize: 16, color: '#111827',
  },
  checkboxWrapper: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  checkboxLabel: { fontSize: 15, color: '#4B5563', marginLeft: 12 },
  listButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listButtonText: { fontSize: 16, color: '#111827' },
  placeholderText: { color: '#9CA3AF' },
  dropdownIcon: { fontSize: 12, color: '#9CA3AF' },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FFF1F2' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4, marginLeft: 4 },
  submitButton: { borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 20 },
  disabledButton: { opacity: 0.6 },
  submitButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  modal: { justifyContent: 'flex-end', margin: 0 },
  modalContent: { 
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, 
    paddingBottom: 40, maxHeight: '80%' 
  },
  modalHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' 
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeModal: { color: '#1F93FF', fontWeight: '600' },
  listItem: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' 
  },
  listItemText: { fontSize: 16, color: '#374151' },
  // Date Picker Styles
  datePickerBody: { flexDirection: 'row', height: 280, paddingHorizontal: 10 },
  datePickerColumn: { flex: 1, alignItems: 'center' },
  datePickerLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 10, marginTop: 10, fontWeight: '600' },
  dateItem: { paddingVertical: 12, width: '100%', alignItems: 'center', borderRadius: 8 },
  dateItemSelected: { backgroundColor: '#F9FAFB' },
  dateItemText: { fontSize: 16, color: '#4B5563' },
});

export default PreChatForm;
