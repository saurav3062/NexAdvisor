'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUpdateProfile, useUploadAvatar } from '../hooks/useAuth';
import { User, Mail, MapPin, Globe, Camera, Briefcase, Calendar, Star, Save, X, Plus, Trash2, GraduationCap, Award, Languages, DollarSign, Clock, CreditCard as Edit2, ExternalLink, BadgeCheck, Users, TrendingUp, Building2, FileText, Loader2 } from 'lucide-react';
import { FadeIn } from '../components/animations/FadeIn';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useSupabaseCategories } from '../hooks/useSupabaseCategories';

interface ExpertProfile {
  id: string;
  title: string;
  bio: string;
  hourly_rate: number;
  location: string;
  company: string;
  years_of_experience: number;
  category_id: string;
  total_consultations: number;
  rating: number;
  total_reviews: number;
  verified: boolean;
  featured: boolean;
  skills: { id: string; name: string }[];
  languages: { id: string; language: string; proficiency: string }[];
  education: { id: string; institution: string; degree: string; field: string }[];
  certifications: { id: string; name: string; issuer: string }[];
}

const languageOptions = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Mandarin', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian', 'Dutch'
];

export function ProfilePage() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const { data: categories } = useSupabaseCategories();

  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'expertise' | 'credentials'>('profile');

  // User profile state
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    website: '',
    bio: ''
  });

  // Expert profile state
  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(null);
  const [expertFormData, setExpertFormData] = useState({
    title: '',
    bio: '',
    hourly_rate: 50,
    location: '',
    company: '',
    years_of_experience: 0,
    category_id: ''
  });
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newEducation, setNewEducation] = useState({ institution: '', degree: '', field: '' });
  const [newCertification, setNewCertification] = useState({ name: '', issuer: '' });

  const isExpert = user?.role === 'expert';

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        location: user.location || '',
        website: user.website || '',
        bio: user.bio || ''
      });

      if (user.role === 'expert') {
        loadExpertProfile();
      } else {
        setLoading(false);
      }
    }
  }, [user]);

  const loadExpertProfile = async () => {
    if (!user) return;

    try {
      const { data: expert, error } = await supabase
        .from('experts')
        .select(`
          *,
          skills:expert_skills(id, name),
          languages:expert_languages(id, language, proficiency),
          education:expert_education(id, institution, degree, field),
          certifications:expert_certifications(id, name, issuer)
        `)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (expert) {
        setExpertProfile(expert);
        setExpertFormData({
          title: expert.title || '',
          bio: expert.bio || '',
          hourly_rate: expert.hourly_rate || 50,
          location: expert.location || '',
          company: expert.company || '',
          years_of_experience: expert.years_of_experience || 0,
          category_id: expert.category_id || ''
        });
      }
    } catch (error) {
      console.error('Failed to load expert profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return <LoadingSpinner />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update user profile
      await updateProfile.mutateAsync({
        name: formData.name,
        location: formData.location,
        website: formData.website,
        bio: formData.bio
      });

      // Update expert profile if applicable
      if (isExpert && expertProfile) {
        await supabase
          .from('experts')
          .update({
            title: expertFormData.title,
            bio: expertFormData.bio,
            hourly_rate: expertFormData.hourly_rate,
            location: expertFormData.location,
            company: expertFormData.company,
            years_of_experience: expertFormData.years_of_experience,
            category_id: expertFormData.category_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', expertProfile.id);
      }

      toast.success('Profile updated successfully');
      setIsEditing(false);
      if (isExpert) loadExpertProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      await uploadAvatar.mutateAsync(file);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      location: user.location || '',
      website: user.website || '',
      bio: user.bio || ''
    });
    if (isExpert && expertProfile) {
      setExpertFormData({
        title: expertProfile.title || '',
        bio: expertProfile.bio || '',
        hourly_rate: expertProfile.hourly_rate || 50,
        location: expertProfile.location || '',
        company: expertProfile.company || '',
        years_of_experience: expertProfile.years_of_experience || 0,
        category_id: expertProfile.category_id || ''
      });
    }
    setIsEditing(false);
  };

  // Skills management
  const addSkill = async () => {
    if (!newSkill.trim() || !expertProfile) return;

    try {
      const { data } = await supabase
        .from('expert_skills')
        .insert({ expert_id: expertProfile.id, name: newSkill.trim() })
        .select()
        .single();

      if (data) {
        setExpertProfile({
          ...expertProfile,
          skills: [...expertProfile.skills, data]
        });
        setNewSkill('');
        toast.success('Skill added');
      }
    } catch (error) {
      toast.error('Failed to add skill');
    }
  };

  const removeSkill = async (skillId: string) => {
    if (!expertProfile) return;

    try {
      await supabase.from('expert_skills').delete().eq('id', skillId);
      setExpertProfile({
        ...expertProfile,
        skills: expertProfile.skills.filter(s => s.id !== skillId)
      });
      toast.success('Skill removed');
    } catch (error) {
      toast.error('Failed to remove skill');
    }
  };

  // Language management
  const addLanguage = async (lang: string) => {
    if (!lang || !expertProfile) return;

    try {
      const { data } = await supabase
        .from('expert_languages')
        .insert({ expert_id: expertProfile.id, language: lang, proficiency: 'fluent' })
        .select()
        .single();

      if (data) {
        setExpertProfile({
          ...expertProfile,
          languages: [...expertProfile.languages, data]
        });
        setNewLanguage('');
        toast.success('Language added');
      }
    } catch (error) {
      toast.error('Failed to add language');
    }
  };

  const removeLanguage = async (langId: string) => {
    if (!expertProfile) return;

    try {
      await supabase.from('expert_languages').delete().eq('id', langId);
      setExpertProfile({
        ...expertProfile,
        languages: expertProfile.languages.filter(l => l.id !== langId)
      });
      toast.success('Language removed');
    } catch (error) {
      toast.error('Failed to remove language');
    }
  };

  // Education management
  const addEducation = async () => {
    if (!newEducation.institution || !newEducation.degree || !expertProfile) return;

    try {
      const { data } = await supabase
        .from('expert_education')
        .insert({
          expert_id: expertProfile.id,
          institution: newEducation.institution,
          degree: newEducation.degree,
          field: newEducation.field,
          start_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (data) {
        setExpertProfile({
          ...expertProfile,
          education: [...expertProfile.education, data]
        });
        setNewEducation({ institution: '', degree: '', field: '' });
        toast.success('Education added');
      }
    } catch (error) {
      toast.error('Failed to add education');
    }
  };

  const removeEducation = async (eduId: string) => {
    if (!expertProfile) return;

    try {
      await supabase.from('expert_education').delete().eq('id', eduId);
      setExpertProfile({
        ...expertProfile,
        education: expertProfile.education.filter(e => e.id !== eduId)
      });
      toast.success('Education removed');
    } catch (error) {
      toast.error('Failed to remove education');
    }
  };

  // Certification management
  const addCertification = async () => {
    if (!newCertification.name || !newCertification.issuer || !expertProfile) return;

    try {
      const { data } = await supabase
        .from('expert_certifications')
        .insert({
          expert_id: expertProfile.id,
          name: newCertification.name,
          issuer: newCertification.issuer,
          issue_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (data) {
        setExpertProfile({
          ...expertProfile,
          certifications: [...expertProfile.certifications, data]
        });
        setNewCertification({ name: '', issuer: '' });
        toast.success('Certification added');
      }
    } catch (error) {
      toast.error('Failed to add certification');
    }
  };

  const removeCertification = async (certId: string) => {
    if (!expertProfile) return;

    try {
      await supabase.from('expert_certifications').delete().eq('id', certId);
      setExpertProfile({
        ...expertProfile,
        certifications: expertProfile.certifications.filter(c => c.id !== certId)
      });
      toast.success('Certification removed');
    } catch (error) {
      toast.error('Failed to remove certification');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <FadeIn>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Cover Area */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600" />

          {/* Profile Header */}
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 sm:-mt-12">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=3b82f6&color=fff&size=128`}
                    alt={user.name}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      {uploading ? (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5 text-gray-600" />
                      )}
                    </label>
                  )}
                </div>

                {/* User Info */}
                <div className="mt-4 sm:mt-0 sm:mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                    {isExpert && (
                      <>
                        {expertProfile?.verified && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            <BadgeCheck className="w-3 h-3" />
                            Verified Expert
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Expert
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-gray-600 flex items-center gap-1 mt-1">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                  {user.location && (
                    <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      {user.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  Joined {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              {isExpert && expertProfile && (
                <>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-gray-600">{expertProfile.rating?.toFixed(1) || '0.0'} rating ({expertProfile.total_reviews || 0} reviews)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{expertProfile.total_consultations || 0} consultations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">${expertProfile.hourly_rate || 0}/hr</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabs for Experts */}
          {isExpert && (
            <div className="border-b">
              <nav className="flex gap-8 px-6">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'expertise', label: 'Expertise', icon: Briefcase },
                  { id: 'credentials', label: 'Credentials', icon: Award }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          )}

          {/* Form Section */}
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={!isEditing}
                        className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 transition-colors"
                        placeholder="Your name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        disabled={!isEditing}
                        className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 transition-colors"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        disabled={!isEditing}
                        className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 transition-colors"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!isEditing}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600 transition-colors resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  {/* Expert-specific fields */}
                  {isExpert && (
                    <>
                      <div className="border-t pt-6">
                        <h3 className="font-medium text-gray-900 mb-4">Expert Profile</h3>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Professional Title
                        </label>
                        <input
                          type="text"
                          value={expertFormData.title}
                          onChange={(e) => setExpertFormData({ ...expertFormData, title: e.target.value })}
                          disabled={!isEditing}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                          placeholder="e.g., Senior Software Engineer"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                          </label>
                          <select
                            value={expertFormData.category_id}
                            onChange={(e) => setExpertFormData({ ...expertFormData, category_id: e.target.value })}
                            disabled={!isEditing}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                          >
                            <option value="">Select category</option>
                            {categories?.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hourly Rate ($)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={expertFormData.hourly_rate}
                            onChange={(e) => setExpertFormData({ ...expertFormData, hourly_rate: parseFloat(e.target.value) || 0 })}
                            disabled={!isEditing}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company
                          </label>
                          <input
                            type="text"
                            value={expertFormData.company}
                            onChange={(e) => setExpertFormData({ ...expertFormData, company: e.target.value })}
                            disabled={!isEditing}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                            placeholder="Current employer"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Years of Experience
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={expertFormData.years_of_experience}
                            onChange={(e) => setExpertFormData({ ...expertFormData, years_of_experience: parseInt(e.target.value) || 0 })}
                            disabled={!isEditing}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === 'expertise' && isExpert && expertProfile && (
                <motion.div
                  key="expertise"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 space-y-6"
                >
                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills & Expertise
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        placeholder="Add a skill..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {expertProfile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {expertProfile.skills.map((skill) => (
                          <span
                            key={skill.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full"
                          >
                            {skill.name}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill.id)}
                              className="hover:bg-blue-200 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Languages */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Languages
                    </label>
                    <select
                      value={newLanguage}
                      onChange={(e) => {
                        if (e.target.value) addLanguage(e.target.value);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Add a language...</option>
                      {languageOptions
                        .filter(l => !expertProfile.languages.some(el => el.language === l))
                        .map((lang) => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>

                    {expertProfile.languages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {expertProfile.languages.map((lang) => (
                          <span
                            key={lang.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full"
                          >
                            {lang.language}
                            <button
                              type="button"
                              onClick={() => removeLanguage(lang.id)}
                              className="hover:bg-green-200 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'credentials' && isExpert && expertProfile && (
                <motion.div
                  key="credentials"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 space-y-6"
                >
                  {/* Education */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <GraduationCap className="w-4 h-4 inline mr-1" />
                      Education
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newEducation.institution}
                        onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
                        placeholder="Institution"
                        className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={newEducation.degree}
                        onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                        placeholder="Degree"
                        className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newEducation.field}
                          onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
                          placeholder="Field"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={addEducation}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {expertProfile.education.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {expertProfile.education.map((edu) => (
                          <div
                            key={edu.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{edu.degree}</p>
                              <p className="text-sm text-gray-600">{edu.institution} - {edu.field}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeEducation(edu.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Certifications */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Award className="w-4 h-4 inline mr-1" />
                      Certifications
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newCertification.name}
                        onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                        placeholder="Certification name"
                        className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCertification.issuer}
                          onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                          placeholder="Issuing organization"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={addCertification}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {expertProfile.certifications.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {expertProfile.certifications.map((cert) => (
                          <div
                            key={cert.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{cert.name}</p>
                              <p className="text-sm text-gray-600">{cert.issuer}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCertification(cert.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isEditing && (
              <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  whileHover={{ scale: saving ? 1 : 1.02 }}
                  whileTap={{ scale: saving ? 1 : 0.98 }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </form>
        </div>
      </FadeIn>
    </div>
  );
}
