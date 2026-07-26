import React from 'react';
import { IMaskMixin } from 'react-imask';
import { Input } from './Input';

// O MaskedBase recebe o "inputRef" que o IMaskMixin injeta, garantindo
// tipagem 100% rigorosa (sem as string, sem unknown e sem any)
const MaskedBase = ({
  inputRef,
  ...props
}: React.ComponentProps<typeof Input> & { inputRef: React.Ref<HTMLInputElement> }) => (
  <Input ref={inputRef} {...props} />
);

export const MaskedInput = IMaskMixin(MaskedBase);
MaskedInput.displayName = 'MaskedInput';