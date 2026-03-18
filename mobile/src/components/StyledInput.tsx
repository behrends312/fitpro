import { TextInput, TextInputProps, View, ViewStyle } from 'react-native';

interface Props extends TextInputProps {
  containerStyle?: ViewStyle;
  containerClassName?: string;
}

/**
 * TextInput com backgroundColor explicitamente transparente para evitar
 * o highlight/escurecimento nativo do iOS quando o dedo passa por cima
 * durante o scroll.
 */
export function StyledInput({ style, containerStyle, containerClassName, ...props }: Props) {
  return (
    <TextInput
      {...props}
      style={[{ backgroundColor: 'transparent', color: '#e2e2ef' }, style as any]}
    />
  );
}
