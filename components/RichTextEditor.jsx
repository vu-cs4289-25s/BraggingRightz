import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { RichEditor, RichToolbar } from 'react-native-pell-rich-editor';

const RichTextEditor = ({ editorRef, onChange }) => {
  return (
    <View style={{ minHeight: 285 }}>
      <RichToolbar editor={editorRef} />
      <RichEditor
        ref={editorRef}
        onChange={onChange}
        placeholder="Write your content here..."
      />
    </View>
  );
};

export default RichTextEditor;

const styles = StyleSheet.create({});
