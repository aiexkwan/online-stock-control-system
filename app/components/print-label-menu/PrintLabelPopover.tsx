import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import QcLabelForm from './QcLabelForm';
import GrnLabelForm from './GrnLabelForm';

export default function PrintLabelPopover() {
  return (
    <Tabs.Root defaultValue="qc" className="w-[340px]">
      <Tabs.List className="flex border-b border-gray-700">
        <Tabs.Trigger value="qc" className="flex-1 px-4 py-2 text-base font-semibold text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500">QC Label</Tabs.Trigger>
        <Tabs.Trigger value="grn" className="flex-1 px-4 py-2 text-base font-semibold text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500">GRN Label</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="qc">
        <QcLabelForm />
      </Tabs.Content>
      <Tabs.Content value="grn">
        <GrnLabelForm />
      </Tabs.Content>
    </Tabs.Root>
  );
} 