'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Briefcase, MapPin, DollarSign, Clock,
  GraduationCap, Award, Languages, FileText, Check, Loader2,
  Building2, Star, Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { FadeIn } from '../components/animations/FadeIn';
import { useSupabaseCategories } from '../hooks/useSupabaseCategories';

interface ExpertOnboardingData {
  title: string;
  bio: string;
  category_id: string;
  hourly_rate: number;
  location: string;
  company: string;
  years_of_experience: number;
  skills: string[];
  languages: string[];
  education: { institution: string; degree: string; field: string }[];
  certifications: { name: string; issuer: string }[];
}

const initialData: ExpertOnboardingData = {
  title: '',
  bio: '',
  category_id: '',
  hourly_rate: 50,
  location: '',
  company: '',
  years_of_experience: 0,
  skills: [],
  languages: [],
  education: [],
  certifications: []
};

const languageOptions = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Mandarin', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian', 'Dutch'
];

export function ExpertOnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: categories } = useSupabaseCategories();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExpertOnboardingData>(initialData);
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newEducation, setNewEducation] = useState({ institution: '', degree: '', field: '' });
  const [newCertification, setNewCertification] = useState({ name: '', issuer: '' });

  const totalSteps = 4;

  useEffect(() => {
    if (!user || user.role !== 'expert') {
      router.push('/');
    }
  }, [user, router]);

  // Check if expert profile already exists and load data
  useEffect(() => {
    const loadExpertData = async () => {
      if (!user) return;

      const { data: expert } = await supabase
        .from('experts')
        .select('*, skills:expert_skills(*), languages:expert_languages(*)')
        .eq('user_id', user.id)
        .single();

      if (expert) {
        setData({
          title: expert.title || '',
          bio: expert.bio || '',
          category_id: expert.category_id || '',
          hourly_rate: expert.hourly_rate || 50,
          location: expert.location || '',
          company: expert.company || '',
          years_of_experience: expert.years_of_experience || 0,
          skills: expert.skills?.map((s: any) => s.name) || [],
          languages: expert.languages?.map((l: any) => l.language) || [],
          education: [],
          certifications: []
        });
      }
    };

    loadExpertData();
  }, [user]);

  const handleSaveAndContinue = async () => {
    if (step < totalSteps) {
      // Save current step to database
      await saveStepData();
      setStep(step + 1);
    } else {
      // Final step - complete onboarding
      await completeOnboarding();
    }
  };

  const saveStepData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: existingExpert } = await supabase
        .from('experts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingExpert) {
        // Update existing expert
        await supabase
          .from('experts')
          .update({
            title: data.title,
            bio: data.bio,
            category_id: data.category_id || null,
            hourly_rate: data.hourly_rate,
            location: data.location,
            company: data.company,
            years_of_experience: data.years_of_experience,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        // Update skills
        if (step === 2 && data.skills.length > 0) {
          await supabase.from('expert_skills').delete().eq('expert_id', existingExpert.id);
          for (const skill of data.skills) {
            await supabase.from('expert_skills').insert({
              expert_id: existingExpert.id,
              name: skill
            });
          }
        }

        // Update languages
        if (step === 3 && data.languages.length > 0) {
          await supabase.from('expert_languages').delete().eq('expert_id', existingExpert.id);
          for (const language of data.languages) {
            await supabase.from('expert_languages').insert({
              expert_id: existingExpert.id,
              language: language,
              proficiency: 'fluent'
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to save step data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await saveStepData();
      toast.success('Profile setup complete!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !data.skills.includes(newSkill.trim())) {
      setData({ ...data, skills: [...data.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setData({ ...data, skills: data.skills.filter(s => s !== skill) });
  };

  const addLanguage = (lang: string) => {
    if (lang && !data.languages.includes(lang)) {
      setData({ ...data, languages: [...data.languages, lang] });
    }
    setNewLanguage('');
  };

  const removeLanguage = (lang: string) => {
    setData({ ...data, languages: data.languages.filter(l => l !== lang) });
  };

  const addEducation = () => {
    if (newEducation.institution && newEducation.degree) {
      setData({ ...data, education: [...data.education, { ...newEducation }] });
      setNewEducation({ institution: '', degree: '', field: '' });
    }
  };

  const removeEducation = (index: number) => {
    setData({ ...data, education: data.education.filter((_, i) => i !== index) });
  };

  const addCertification = () => {
    if (newCertification.name && newCertification.issuer) {
      setData({ ...data, certifications: [...data.certifications, { ...newCertification }] });
      setNewCertification({ name: '', issuer: '' });
    }
  };

  const removeCertification = (index: number) => {
    setData({ ...data, certifications: data.certifications.filter((_, i) => i !== index) });
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.title && data.category_id && data.hourly_rate > 0;
      case 2:
        return data.skills.length >= 3 && data.years_of_experience >= 0;
      case 3:
        return data.languages.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <Briefcase className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Professional Details</h2>
              <p className="text-gray-600 mt-2">Tell us about your expertise</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Title *
              </label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                placeholder="e.g., Senior Software Engineer, Financial Consultant"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Category *
              </label>
              <select
                value={data.category_id}
                onChange={(e) => setData({ ...data, category_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a category</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Hourly Rate ($) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={data.hourly_rate}
                  onChange={(e) => setData({ ...data, hourly_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={data.years_of_experience}
                  onChange={(e) => setData({ ...data, years_of_experience: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={data.location}
                  onChange={(e) => setData({ ...data, location: e.target.value })}
                  placeholder="City, Country"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Company
                </label>
                <input
                  type="text"
                  value={data.company}
                  onChange={(e) => setData({ ...data, company: e.target.value })}
                  placeholder="Current employer"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Bio
              </label>
              <textarea
                rows={4}
                value={data.bio}
                onChange={(e) => setData({ ...data, bio: e.target.value })}
                placeholder="Tell clients about your background, expertise, and what you can help them with..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <Star className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Skills & Expertise</h2>
              <p className="text-gray-600 mt-2">Add at least 3 skills you specialize in</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Skills *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="e.g., JavaScript, Financial Planning, Contract Law"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Press Enter or click Add to add a skill</p>
            </div>

            {data.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600">
                <Users className="h-4 w-4 inline mr-1" />
                {data.skills.length} skill{data.skills.length !== 1 ? 's' : ''} added (minimum 3 required)
              </p>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <Languages className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Languages & Credentials</h2>
              <p className="text-gray-600 mt-2">Select languages you can consult in</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages *
              </label>
              <select
                value={newLanguage}
                onChange={(e) => {
                  addLanguage(e.target.value);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a language</option>
                {languageOptions.filter(l => !data.languages.includes(l)).map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {data.languages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.languages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeLanguage(lang)}
                      className="hover:bg-green-200 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="border-t pt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <GraduationCap className="h-4 w-4 inline mr-1" />
                  Education (Optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newEducation.institution}
                    onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
                    placeholder="Institution"
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={newEducation.degree}
                    onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                    placeholder="Degree"
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newEducation.field}
                      onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
                      placeholder="Field of Study"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addEducation}
                      className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {data.education.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {data.education.map((edu, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{edu.degree}</p>
                          <p className="text-sm text-gray-600">{edu.institution} - {edu.field}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <Award className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Certifications & Final Touches</h2>
              <p className="text-gray-600 mt-2">Add any relevant certifications or credentials</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certifications (Optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newCertification.name}
                  onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                  placeholder="Certification name"
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCertification.issuer}
                    onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                    placeholder="Issuing organization"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addCertification}
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              {data.certifications.length > 0 && (
                <div className="mt-3 space-y-2">
                  {data.certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{cert.name}</p>
                        <p className="text-sm text-gray-600">{cert.issuer}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCertification(index)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-xl p-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Profile Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Title</p>
                  <p className="font-medium text-gray-900">{data.title || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Category</p>
                  <p className="font-medium text-gray-900">
                    {categories?.find(c => c.id === data.category_id)?.name || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Hourly Rate</p>
                  <p className="font-medium text-gray-900">${data.hourly_rate}/hr</p>
                </div>
                <div>
                  <p className="text-gray-600">Experience</p>
                  <p className="font-medium text-gray-900">{data.years_of_experience} years</p>
                </div>
                <div>
                  <p className="text-gray-600">Skills</p>
                  <p className="font-medium text-gray-900">{data.skills.length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Languages</p>
                  <p className="font-medium text-gray-900">{data.languages.join(', ')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <FadeIn>
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Step {step} of {totalSteps}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((step / totalSteps) * 100)}% complete
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${(step / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={() => step > 1 && setStep(step - 1)}
                disabled={step === 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  step === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>

              <motion.button
                type="button"
                onClick={handleSaveAndContinue}
                disabled={!canProceed() || loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : step === totalSteps ? (
                  <>
                    <Check className="h-4 w-4" />
                    Complete Setup
                  </>
                ) : (
                  <>
                    Save & Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
