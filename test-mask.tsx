import React, { forwardRef } from 'react';
import { IMaskMixin } from 'react-imask';
import { Input } from './src/components/ui/Input';

const MaskedBase = ({ inputRef, ...props }: React.ComponentProps<typeof Input> & { inputRef: React.Ref<HTMLInputElement> }) => (
  <Input ref={inputRef} {...props} />
);
export const MaskedInput = IMaskMixin(MaskedBase);

export const TestForm = () => (
  <MaskedInput 
    mask="000.000.000-00" 
    onAccept={(val) => console.log(val)} 
    placeholder="000.000.000-00" 
  />
);
