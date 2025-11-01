'use client';

import { SliderDemo } from './demos/SliderDemo';
import { InputDemo } from './demos/InputDemo';
import { ButtonDemo } from './demos/ButtonDemo';
import { ToggleDemo } from './demos/ToggleDemo';
import { SelectDemo } from './demos/SelectDemo';
import { TextareaDemo } from './demos/TextareaDemo';
import { CardDemo } from './demos/CardDemo';
import { DialogDemo } from './demos/DialogDemo';

interface ComponentDemoProps {
  activeComponent: string;
}

export function ComponentDemo({ activeComponent }: ComponentDemoProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8 bg-black">
      <div className="max-w-4xl mx-auto">
        {activeComponent === 'slider' && <SliderDemo />}
        {activeComponent === 'input' && <InputDemo />}
        {activeComponent === 'button' && <ButtonDemo />}
        {activeComponent === 'toggle' && <ToggleDemo />}
        {activeComponent === 'select' && <SelectDemo />}
        {activeComponent === 'textarea' && <TextareaDemo />}
        {activeComponent === 'card' && <CardDemo />}
        {activeComponent === 'dialog' && <DialogDemo />}
      </div>
    </div>
  );
}
