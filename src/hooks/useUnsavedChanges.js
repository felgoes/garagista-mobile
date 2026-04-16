import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

export function useUnsavedChanges(navigation, isDirty) {
  const savedRef = useRef(false);

  useEffect(() => {
    if (isDirty) savedRef.current = false;
  }, [isDirty]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty || savedRef.current) return;
      e.preventDefault();
      Alert.alert(
        'Descartar alterações?',
        'Você tem dados não salvos. Deseja sair mesmo assim?',
        [
          { text: 'Continuar editando', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, isDirty]);

  return { markSaved: () => { savedRef.current = true; } };
}
