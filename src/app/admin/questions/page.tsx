'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNav from '@/components/admin/AdminNav';

type QuestionOptionItem = {
  id: number;
  optionText: string;
  orderIndex: number;
};

type SectionItem = {
  id: number;
  sectionKey: string;
  sectionTitle: string;
};

type Question = {
  id: number;
  sectionId: number;
  questionNumber: string;
  questionText: string;
  questionType: 'radio' | 'checkbox' | 'text';
  orderIndex: number;
  minSelections: number | null;
  maxSelections: number | null;
  hasOtherOption: boolean;
  isActive: boolean;
  currentRevision: number;
  options?: QuestionOptionItem[];
  section?: SectionItem | null;
  revisionCount: number;
  hasResponses: boolean;
};

type QuestionFormState = {
  sectionId: number;
  questionNumber: string;
  questionText: string;
  questionType: 'radio' | 'checkbox' | 'text';
  minSelections: string;
  maxSelections: string;
  hasOtherOption: boolean;
  options: string[];
  changeReason: string;
};

const DEFAULT_FORM: QuestionFormState = {
  sectionId: 1,
  questionNumber: '',
  questionText: '',
  questionType: 'radio',
  minSelections: '',
  maxSelections: '',
  hasOtherOption: false,
  options: ['', ''],
  changeReason: '',
};

export default function QuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal State: null = closed, 'edit' = editing existing, 'add' = creating new
  const [modalMode, setModalMode] = useState<'edit' | 'add' | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [form, setForm] = useState<QuestionFormState>(DEFAULT_FORM);
  const [deleteConfirmQuestion, setDeleteConfirmQuestion] = useState<Question | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/questions');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const qList = Array.isArray(data)
          ? data
          : data.questions || data.data || [];
        setQuestions(qList);
        if (data.sections && Array.isArray(data.sections)) {
          setSections(data.sections);
        }
      }
    } catch (error) {
      console.error('Failed to fetch questions', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleAction = async (id: number, action: string, newOrderIndex?: number) => {
    try {
      await fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: id, action, newOrderIndex }),
      });
      fetchQuestions();
    } catch (error) {
      console.error('Failed to perform action', error);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/questions?id=${questionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteConfirmQuestion(null);
        setSuccessMessage(data.message || 'Question deleted successfully.');
        setTimeout(() => setSuccessMessage(null), 4000);
        fetchQuestions();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to delete question.');
      }
    } catch (error) {
      console.error('Failed to delete question', error);
      alert('An error occurred while deleting question.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAdd = () => {
    const nextQNum = `Q${questions.length + 1}`;
    setForm({
      ...DEFAULT_FORM,
      sectionId: sections[0]?.id || 1,
      questionNumber: nextQNum,
      options: ['Option 1', 'Option 2'],
    });
    setActiveQuestion(null);
    setModalMode('add');
  };

  const handleOpenEdit = (q: Question) => {
    setActiveQuestion(q);
    setForm({
      sectionId: q.sectionId,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      questionType: q.questionType,
      minSelections: q.minSelections ? String(q.minSelections) : '',
      maxSelections: q.maxSelections ? String(q.maxSelections) : '',
      hasOtherOption: q.hasOtherOption,
      options: q.options?.map((o) => o.optionText) || ['', ''],
      changeReason: '',
    });
    setModalMode('edit');
  };

  // Option list handlers
  const handleAddOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, `Option ${prev.options.length + 1}`],
    }));
  };

  const handleRemoveOption = (index: number) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleOptionChange = (index: number, val: string) => {
    setForm((prev) => {
      const updated = [...prev.options];
      updated[index] = val;
      return { ...prev, options: updated };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.questionText.trim()) {
      alert('Please enter question text.');
      return;
    }

    if (form.questionType !== 'text') {
      const validOptions = form.options.filter((o) => o.trim().length > 0);
      if (validOptions.length < 2) {
        alert('Please provide at least 2 options for Multiple Choice questions.');
        return;
      }
    }

    if (modalMode === 'edit' && activeQuestion) {
      if (activeQuestion.hasResponses && !form.changeReason.trim()) {
        alert('Please enter a reason for the change, as this question already has responses.');
        return;
      }

      setSaving(true);
      try {
        await fetch('/api/admin/questions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: activeQuestion.id,
            sectionId: Number(form.sectionId),
            questionNumber: form.questionNumber.trim(),
            questionText: form.questionText.trim(),
            questionType: form.questionType,
            minSelections: form.minSelections ? Number(form.minSelections) : null,
            maxSelections: form.maxSelections ? Number(form.maxSelections) : null,
            hasOtherOption: form.hasOtherOption,
            options: form.options.filter((o) => o.trim().length > 0),
            changeReason: form.changeReason.trim() || 'Admin update',
          }),
        });
        setModalMode(null);
        fetchQuestions();
      } catch (err) {
        console.error('Failed to save question edits', err);
      } finally {
        setSaving(false);
      }
    } else if (modalMode === 'add') {
      setSaving(true);
      try {
        await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId: Number(form.sectionId),
            questionNumber: form.questionNumber.trim(),
            questionText: form.questionText.trim(),
            questionType: form.questionType,
            minSelections: form.minSelections ? Number(form.minSelections) : null,
            maxSelections: form.maxSelections ? Number(form.maxSelections) : null,
            hasOtherOption: form.hasOtherOption,
            options: form.options.filter((o) => o.trim().length > 0),
          }),
        });
        setModalMode(null);
        fetchQuestions();
      } catch (err) {
        console.error('Failed to create new question', err);
      } finally {
        setSaving(false);
      }
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'radio':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-100 text-blue-800 border border-blue-200">
            MCQ (Single)
          </span>
        );
      case 'checkbox':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-100 text-purple-800 border border-purple-200">
            MSQ (Multiple)
          </span>
        );
      case 'text':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
            Open Text
          </span>
        );
      default:
        return <span className="px-2 py-0.5 text-xs rounded-md bg-gray-100 text-gray-800">{type}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative pb-12">
      <AdminNav />
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Manage Questions</h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Create new questions, edit question text & options, configure MCQ / MSQ types, and manage question order.
            </p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={handleOpenAdd}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-[#1b2a4a] hover:bg-[#2a3f6a] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Question
            </button>
            <Link href="/admin" className="text-xs sm:text-sm text-[#1b2a4a] hover:underline font-medium">
              &larr; Dashboard
            </Link>
          </div>
        </div>

        {/* Success alert */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500 font-medium text-sm">Loading questions...</div>
        ) : (
          <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
            <ul className="divide-y divide-gray-200">
              {questions.map((q, idx) => (
                <li key={q.id}>
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50/70 transition gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                        <span className="font-bold text-[#1b2a4a] text-sm mr-1">{q.questionNumber}</span>
                        {getTypeBadge(q.questionType)}
                        {q.section && (
                          <span className="px-2 py-0.5 text-xs rounded-md bg-gray-100 text-gray-600 border font-medium">
                            Sec {q.section.sectionKey}
                          </span>
                        )}
                        {q.hasOtherOption && (
                          <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                            + Other Input
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-gray-900 leading-snug break-words">{q.questionText}</h3>

                      <div className="mt-2 flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                        {q.questionType !== 'text' && (
                          <span>
                            Options:{' '}
                            <strong className="text-gray-700 font-semibold">{q.options?.length || 0}</strong>
                          </span>
                        )}
                        {q.questionType === 'checkbox' && (
                          <span>
                            Constraints:{' '}
                            <strong className="text-gray-700">
                              {q.minSelections && q.minSelections === q.maxSelections
                                ? `Exact ${q.minSelections}`
                                : q.maxSelections
                                ? `Max ${q.maxSelections}`
                                : 'Unlimited'}
                            </strong>
                          </span>
                        )}
                        <span>
                          Revision: <strong className="text-gray-700">v{q.revisionCount || q.currentRevision || 1}</strong>
                        </span>
                        {q.hasResponses && (
                          <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Has Submissions (Version-Protected)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons with full mobile responsiveness */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <button
                        onClick={() => idx > 0 && handleAction(q.id, 'reorder', questions[idx - 1].orderIndex)}
                        disabled={idx === 0}
                        className="p-1.5 text-gray-600 hover:text-gray-900 disabled:opacity-30 border border-gray-200 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                        title="Move Up"
                      >
                        &uarr;
                      </button>
                      <button
                        onClick={() => idx < questions.length - 1 && handleAction(q.id, 'reorder', questions[idx + 1].orderIndex)}
                        disabled={idx === questions.length - 1}
                        className="p-1.5 text-gray-600 hover:text-gray-900 disabled:opacity-30 border border-gray-200 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                        title="Move Down"
                      >
                        &darr;
                      </button>
                      <button
                        onClick={() => handleOpenEdit(q)}
                        className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition shadow-xs cursor-pointer"
                      >
                        Edit Question &amp; Options
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmQuestion(q)}
                        className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                        title="Delete Question"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Delete Question Confirmation Modal */}
        {deleteConfirmQuestion && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Delete Question?</h3>
                  <p className="text-xs text-gray-500 font-semibold">{deleteConfirmQuestion.questionNumber} • {deleteConfirmQuestion.questionType.toUpperCase()}</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                <p className="text-xs font-semibold text-gray-900 line-clamp-2">
                  {deleteConfirmQuestion.questionText}
                </p>
                {deleteConfirmQuestion.options && deleteConfirmQuestion.options.length > 0 && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    {deleteConfirmQuestion.options.length} options will be deleted
                  </p>
                )}
              </div>

              <div className="bg-red-50/70 border border-red-200 rounded-xl p-3.5 mb-5 text-xs text-red-800 space-y-1.5 leading-relaxed">
                <p className="font-semibold">⚠️ This will permanently remove:</p>
                <ul className="list-disc list-inside space-y-0.5 text-red-700">
                  <li>This question and its options</li>
                  <li>All revision history for this question</li>
                  {deleteConfirmQuestion.hasResponses && (
                    <li className="font-bold text-red-800">Any respondent answers recorded for this question</li>
                  )}
                  <li>Remaining questions will automatically be re-indexed seamlessly</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirmQuestion(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleDeleteQuestion(deleteConfirmQuestion.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Permanently Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Unified Edit / Add Question Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 md:p-7 max-h-[92vh] flex flex-col my-4 sm:my-8 border border-gray-100">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                {modalMode === 'add' ? 'Add New Question' : `Edit ${activeQuestion?.questionNumber}`}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-1 leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Revision warning for questions with submissions */}
              {modalMode === 'edit' && activeQuestion?.hasResponses && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-3 sm:p-3.5 rounded-r text-xs text-amber-900">
                  <strong className="font-semibold">Version Protection Active:</strong> This question already has recorded responses. Modifying it will create Revision #{((activeQuestion.currentRevision || 1) + 1)} without altering past submission history.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Question Number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Question Identifier
                  </label>
                  <input
                    type="text"
                    required
                    value={form.questionNumber}
                    onChange={(e) => setForm({ ...form, questionNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1b2a4a] outline-none"
                    placeholder="e.g. Q26"
                  />
                </div>

                {/* Section Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Survey Section
                  </label>
                  <select
                    value={form.sectionId}
                    onChange={(e) => setForm({ ...form, sectionId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1b2a4a] outline-none bg-white"
                  >
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        Section {sec.sectionKey}: {sec.sectionTitle}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Question Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.questionText}
                  onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1b2a4a] outline-none"
                  placeholder="Enter the question wording..."
                />
              </div>

              {/* Question Type (MCQ vs MSQ vs Text) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Question Response Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, questionType: 'radio' })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${
                      form.questionType === 'radio'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    MCQ (Single Choice)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, questionType: 'checkbox' })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${
                      form.questionType === 'checkbox'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    MSQ (Multiple Choice)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, questionType: 'text' })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${
                      form.questionType === 'text'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Open Text
                  </button>
                </div>
              </div>

              {/* MSQ Constraints: Min and Max selections */}
              {form.questionType === 'checkbox' && (
                <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-purple-900 mb-1">
                      Min Selections (Optional)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={form.minSelections}
                      onChange={(e) => setForm({ ...form, minSelections: e.target.value })}
                      className="w-full px-3 py-1.5 border border-purple-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="e.g. 3 (leave blank for none)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-purple-900 mb-1">
                      Max Selections (Optional)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={form.maxSelections}
                      onChange={(e) => setForm({ ...form, maxSelections: e.target.value })}
                      className="w-full px-3 py-1.5 border border-purple-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="e.g. 3 (leave blank for unlimited)"
                    />
                  </div>
                </div>
              )}

              {/* Toggle "Other" Option */}
              {form.questionType !== 'text' && (
                <label className="flex items-center space-x-2.5 cursor-pointer select-none bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    checked={form.hasOtherOption}
                    onChange={(e) => setForm({ ...form, hasOtherOption: e.target.checked })}
                    className="w-4 h-4 text-[#1b2a4a] rounded border-gray-300 focus:ring-[#1b2a4a]"
                  />
                  <span className="text-xs font-semibold text-gray-800">
                    Allow &quot;Other (Please specify)&quot; free-text option
                  </span>
                </label>
              )}

              {/* Options Editor (for MCQ and MSQ) */}
              {form.questionType !== 'text' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Answer Choices ({form.options.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-xs font-semibold text-[#1b2a4a] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      + Add Option
                    </button>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto p-1">
                    {form.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 w-5 text-center flex-shrink-0">
                          {oIdx + 1}.
                        </span>
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                          placeholder={`Option ${oIdx + 1}`}
                          className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1b2a4a]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(oIdx)}
                          disabled={form.options.length <= 2}
                          className="p-1.5 text-red-500 hover:text-red-700 disabled:opacity-20 hover:bg-red-50 rounded cursor-pointer flex-shrink-0"
                          title="Remove Option"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Change Reason (Required if question has responses) */}
              {modalMode === 'edit' && activeQuestion?.hasResponses && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Reason for Revision <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.changeReason}
                    onChange={(e) => setForm({ ...form, changeReason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1b2a4a] outline-none"
                    placeholder="e.g. Added new option, updated wording"
                  />
                </div>
              )}

              {/* Form Actions */}
              <div className="border-t pt-4 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#1b2a4a] hover:bg-[#2a3f6a] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </>
                  ) : modalMode === 'add' ? (
                    'Create Question'
                  ) : (
                    'Save Question & Options'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
