/**
 * Main component for rendering and managing questionnaires
 * 
 * Features:
 * - Section-based navigation with progress tracking
 * - Auto-save functionality
 * - Validation with visual feedback
 * - Links to related official court forms
 * - Estimated time remaining
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { QuestionnaireEngine } from "@/lib/questionnaires/engine";
import { QuestionnaireStructure, QuestionnaireResponse } from "@/types/questionnaire";
import { QuestionField } from "./question-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Save, 
  AlertCircle,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Disclaimer } from "@/components/legal/disclaimer";
import { PrenupDocumentsList } from "@/components/prenup/prenup-documents-list";

interface QuestionnaireFormProps {
  structure: QuestionnaireStructure;
  initialResponses?: QuestionnaireResponse;
  onSave?: (responses: QuestionnaireResponse, currentSection: number) => Promise<void>;
  onSubmit?: (responses: QuestionnaireResponse) => Promise<void>;
  onResponsesChange?: (responses: QuestionnaireResponse) => void; // Callback when responses change
  autoSave?: boolean;
  autoSaveDelay?: number; // milliseconds
  relatedFormId?: string;  // ID of related official court form
  relatedFormName?: string;  // Name of related official court form
}

export function QuestionnaireForm({
  structure,
  initialResponses = {},
  onSave,
  onSubmit,
  onResponsesChange,
  autoSave = true,
  autoSaveDelay = 2000,
  relatedFormId,
  relatedFormName,
}: QuestionnaireFormProps) {
  const [engine] = useState(() => new QuestionnaireEngine(structure, initialResponses));
  const [responses, setResponses] = useState<QuestionnaireResponse>(initialResponses);
  const [currentSection, setCurrentSection] = useState(0);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);

  const visibleSections = engine.getVisibleSections();
  const progress = engine.getProgress();

  // Calculate estimated time remaining
  const estimatedTimePerSection = structure.metadata?.estimatedTime 
    ? Math.ceil(structure.metadata.estimatedTime / visibleSections.length)
    : 5;
  const sectionsRemaining = visibleSections.length - currentSection;
  const estimatedTimeRemaining = sectionsRemaining * estimatedTimePerSection;

  // Update engine when responses change
  useEffect(() => {
    engine.updateResponses(responses);
  }, [responses, engine]);

  // Auto-save functionality
  const handleAutoSave = useCallback(async () => {
    if (!onSave || isSaving) return;

    setIsSaving(true);
    setShowSaveIndicator(true);
    try {
      await onSave(responses, currentSection);
      setLastSaved(new Date());
      // Hide save indicator after a delay
      setTimeout(() => setShowSaveIndicator(false), 2000);
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [responses, currentSection, onSave, isSaving]);

  // Handle response changes with auto-save
  const handleResponseChange = (questionId: string, value: any) => {
    const newResponses = { ...responses, [questionId]: value };
    setResponses(newResponses);

    // Notify parent of response changes
    if (onResponsesChange) {
      onResponsesChange(newResponses);
    }

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Validate the changed question
    const question = findQuestion(questionId);
    if (question) {
      engine.updateResponses(newResponses);
      const validation = engine.validateQuestion(question, value);
      if (validation.valid) {
        const newErrors = { ...errors };
        delete newErrors[questionId];
        setErrors(newErrors);
      } else {
        setErrors({ ...errors, [questionId]: validation.errors });
      }
    }

    // Schedule auto-save
    if (autoSave && onSave) {
      const timeout = setTimeout(() => {
        handleAutoSave();
      }, autoSaveDelay);
      setSaveTimeout(timeout);
    }
  };

  // Find a question by ID
  const findQuestion = (questionId: string) => {
    for (const section of structure.sections) {
      const question = section.questions.find((q) => q.id === questionId);
      if (question) return question;
    }
    return undefined;
  };

  // Manual save
  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(responses, currentSection);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate all questions
    engine.updateResponses(responses);
    const validation = engine.validateAll();

    if (!validation.valid) {
      setErrors(validation.errors);
      // Scroll to first error
      const firstErrorId = Object.keys(validation.errors)[0];
      const element = document.getElementById(firstErrorId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      // Surface the first validation error so the user knows why submit didn't fire
      const firstErrorMessage = validation.errors[firstErrorId]?.[0];
      if (firstErrorMessage) {
        alert(firstErrorMessage);
      } else {
        alert("Please complete the required fields before submitting.");
      }
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSave) {
        await onSave(responses, currentSection);
      }
      if (onSubmit) {
        await onSubmit(responses);
        alert("Submitted! Your answers are saved. Next: generate your document on the Documents page.");
      }
    } catch (error) {
      console.error("Submit failed:", error);
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation
  const goToSection = (index: number) => {
    if (index >= 0 && index < visibleSections.length) {
      // Save before navigating
      if (onSave && !isSaving) {
        handleAutoSave();
      }
      setCurrentSection(index);
      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNext = () => {
    if (currentSection < visibleSections.length - 1) {
      goToSection(currentSection + 1);
    }
  };

  const goToPrevious = () => {
    if (currentSection > 0) {
      goToSection(currentSection - 1);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  // Check if section is complete
  const isSectionComplete = (sectionIndex: number): boolean => {
    const section = visibleSections[sectionIndex];
    if (!section) return false;
    
    const visibleQuestions = engine.getVisibleQuestions(section.id);
    return visibleQuestions.every(q => {
      if (!q.required) return true;
      const value = responses[q.id];
      return value !== undefined && value !== null && value !== '';
    });
  };

  const currentSectionData = visibleSections[currentSection];
  const visibleQuestions = currentSectionData
    ? engine.getVisibleQuestions(currentSectionData.id)
    : [];

  // Count errors in current section
  const currentSectionErrors = visibleQuestions.filter(q => errors[q.id]).length;

  return (
    <div className="space-y-6">
      {/* Related form link (title/description shown by parent page) */}
      {relatedFormId && relatedFormName && (
        <div className="flex justify-end">
          <Link 
            href="/legal-info/court-forms"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <FileText className="h-4 w-4" />
            View Official {relatedFormName}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Progress and stats bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                Section {currentSection + 1} of {visibleSections.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {progress.progressPercentage}% Complete
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Estimated time */}
              {estimatedTimeRemaining > 0 && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  ~{estimatedTimeRemaining} min remaining
                </span>
              )}
              
              {/* Save indicator */}
              {showSaveIndicator && (
                <span className="text-sm text-green-600 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </span>
              )}
              
              {isSaving && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              )}
            </div>
          </div>
          
          <Progress value={progress.progressPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Section navigation - horizontal scrollable */}
      {visibleSections.length > 1 && (
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
            {visibleSections.map((section, index) => {
              const isComplete = isSectionComplete(index);
              const isCurrent = index === currentSection;
              const hasErrors = index === currentSection && currentSectionErrors > 0;
              
              return (
                <button
                  key={section.id}
                  onClick={() => goToSection(index)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border",
                    isCurrent
                      ? "bg-primary text-primary-foreground border-primary"
                      : isComplete
                      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      : "bg-muted text-muted-foreground border-muted hover:bg-muted/80"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : hasErrors ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{section.title}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Validation errors alert */}
      {currentSectionErrors > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fix {currentSectionErrors} error{currentSectionErrors > 1 ? 's' : ''} in this section before continuing.
          </AlertDescription>
        </Alert>
      )}

      {/* Current section */}
      {currentSectionData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                {currentSection + 1}
              </span>
              {currentSectionData.title}
            </CardTitle>
            {currentSectionData.description && (
              <CardDescription>{currentSectionData.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {/* Show prenup documents list if in prenup-summary section */}
            {currentSectionData.id === "prenup-summary" && (
              <div className="mb-6">
                <PrenupDocumentsList variant="full" />
              </div>
            )}
            
            {/* Questions */}
            <div className="space-y-6">
              {visibleQuestions.map((question, index) => (
                <div 
                  key={question.id}
                  id={question.id}
                  className={cn(
                    "transition-all",
                    errors[question.id] && "bg-destructive/5 -mx-4 px-4 py-2 rounded-lg"
                  )}
                >
                  <QuestionField
                    question={question}
                    value={responses[question.id] ?? question.defaultValue}
                    onChange={(value) => handleResponseChange(question.id, value)}
                    error={errors[question.id]?.[0]}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation and action buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={goToPrevious}
            disabled={currentSection === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          {currentSection < visibleSections.length - 1 && (
            <Button onClick={goToNext} className="gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {onSave && (
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? "Saving..." : "Save Progress"}
            </Button>
          )}
          {currentSection === visibleSections.length - 1 && onSubmit && (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Submit Questionnaire
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Submit disclaimer */}
      {currentSection === visibleSections.length - 1 && (
        <Disclaimer variant="questionnaire" />
      )}

      {/* Last saved indicator */}
      {lastSaved && !showSaveIndicator && (
        <p className="text-xs text-muted-foreground text-center">
          Last saved: {lastSaved.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
