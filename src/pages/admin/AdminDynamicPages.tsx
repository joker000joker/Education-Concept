import React from 'react';
import { DynamicTableManager, FieldDef } from '../../components/admin/DynamicTableManager';

const ebookFields: FieldDef[] = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'category', label: 'Category', type: 'select', options: [
    { value: 'ssc', label: 'SSC E-BOOKS' },
    { value: 'railways', label: 'RAILWAYS E-BOOKS' },
    { value: 'state-exams', label: 'STATE EXAMS E-BOOKS' }
  ], required: true },
  { name: 'file_path', label: 'PDF File', type: 'file_pdf' },
  { name: 'cover_image_path', label: 'Cover Image', type: 'file_image' },
  { name: 'published', label: 'Published', type: 'boolean' }
];


export const AdminFreeEbooksPage = () => (
  <DynamicTableManager tableName="free_ebooks" title="Free E-Books" fields={ebookFields} />
);

export const AdminCurrentAffairsPage = () => (
  <DynamicTableManager 
    tableName="current_affairs" 
    title="Current Affairs" 
    fields={[
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'file_path', label: 'PDF File', type: 'file_pdf' },
      { name: 'published', label: 'Published', type: 'boolean' }
    ]} 
  />
);

export const AdminExamPatternPage = () => (
  <DynamicTableManager 
    tableName="exam_patterns" 
    title="Exam Pattern & Syllabus" 
    fields={[
      { name: 'exam_category', label: 'Exam Category', type: 'select', options: [
        { value: 'SSC', label: 'SSC' },
        { value: 'Railway', label: 'Railway' },
        { value: 'Bihar', label: 'Bihar' },
        { value: 'UP', label: 'UP' }
      ], required: true },
      { name: 'exam_name', label: 'Exam Name', type: 'text', required: true },
      { name: 'pattern_file_path', label: 'Exam Pattern PDF', type: 'file_pdf' },
      { name: 'syllabus_file_path', label: 'Syllabus PDF', type: 'file_pdf' },
      { name: 'published', label: 'Published', type: 'boolean' }
    ]} 
  />
);

export const AdminStudyResourcesPage = () => (
  <DynamicTableManager 
    tableName="study_resources" 
    title="Study Resources" 
    fields={[
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: [
        { value: 'Previous Year Papers', label: 'Previous Year Papers' },
        { value: 'Practice Sets', label: 'Practice Sets' },
        { value: 'Formula & Short Tricks', label: 'Formula & Short Tricks' },
        { value: 'One-Liners', label: 'One-Liners' }
      ], required: true },
      { name: 'file_path', label: 'Resource File', type: 'file_pdf' },
      { name: 'published', label: 'Published', type: 'boolean' }
    ]} 
  />
);

export const AdminQuestionsPage = () => (
  <div className="p-8 text-center text-slate-500">Question Bank (Coming Soon)</div>
);

export const AdminTestsPage = () => (
  <div className="p-8 text-center text-slate-500">Test Management (Coming Soon)</div>
);

export const AdminTestPassPage = () => (
  <div className="p-8 text-center text-slate-500">Test Passes (Coming Soon)</div>
);

export const AdminBannersPage = () => (
  <DynamicTableManager 
    tableName="banners" 
    title="Home Banners" 
    fields={[
      { name: 'section', label: 'Display Section', type: 'select', options: [
        { value: 'ec_notes_home', label: 'EC Notes Home' },
        { value: 'ec_test_home', label: 'EC Test Home' }
      ], required: true },
      { name: 'image_path', label: 'Banner Image', type: 'file_image' },
      { name: 'link_url', label: 'Link URL (Optional)', type: 'text' },
      { name: 'is_active', label: 'Active', type: 'boolean' }
    ]} 
  />
);

export const AdminRecommendationsPage = () => (
  <DynamicTableManager 
    tableName="top_recommendations" 
    title="Top Recommendations" 
    fields={[
      { name: 'content_type', label: 'Content Type', type: 'select', options: [
        { value: 'notes', label: 'Note' },
        { value: 'paid_ebooks', label: 'Paid E-Book' },
        { value: 'tests', label: 'Test' }
      ], required: true },
      { name: 'content_id', label: 'Content ID', type: 'number', required: true },
      { name: 'is_active', label: 'Active', type: 'boolean' }
    ]} 
  />
);
