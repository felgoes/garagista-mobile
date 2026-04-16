import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SearchSelect({ items, selected, onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      items.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      ),
    [items, query]
  );

  function handleSelect(item) {
    onSelect(item);
    setQuery('');
    setOpen(false);
  }

  function handleClear() {
    onSelect(null);
    setQuery('');
  }

  return (
    <>
      {/* Campo que abre a modal */}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.selectorText, !selected && styles.placeholder]}>
          {selected ? selected.name : placeholder}
        </Text>
        {selected ? (
          <TouchableOpacity onPress={handleClear}>
            <MaterialCommunityIcons name="close" size={18} color="#999" />
          </TouchableOpacity>
        ) : (
          <MaterialCommunityIcons name="chevron-down" size={20} color="#999" />
        )}
      </TouchableOpacity>

      {/* Modal de busca */}
      <Modal visible={open} animationType="slide">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar..."
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => { setOpen(false); setQuery(''); }}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.optionText}>{item.name}</Text>
                {selected?.id === item.id && (
                  <MaterialCommunityIcons name="check" size={18} color="#2563eb" />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  selectorText: { fontSize: 15, color: '#111' },
  placeholder: { color: '#aaa' },
  modal: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#f8fafc',
  },
  closeBtn: { paddingHorizontal: 8 },
  closeBtnText: { color: '#2563eb', fontSize: 15 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  optionText: { fontSize: 15, color: '#222' },
  separator: { height: 1, backgroundColor: '#f0f0f0' },
});
