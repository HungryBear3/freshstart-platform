/**
 * Component for rendering individual questionnaire questions
 */

"use client";

import React from "react";
import { Question } from "@/types/questionnaire";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface QuestionFieldProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

export function QuestionField({
  question,
  value,
  onChange,
  error,
  disabled,
}: QuestionFieldProps) {
  const handleChange = (newValue: any) => {
    onChange(newValue);
  };

  const renderInput = () => {
    switch (question.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <Input
            type={question.type === "email" ? "email" : question.type === "phone" ? "tel" : "text"}
            id={question.id}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.placeholder}
            disabled={disabled}
            className={error ? "border-red-500" : ""}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${question.id}-error` : question.helpText ? `${question.id}-help` : undefined}
          />
        );

      case "textarea":
        return (
          <textarea
            id={question.id}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.placeholder}
            disabled={disabled}
            rows={4}
            className={cn(
              "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500"
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${question.id}-error` : question.helpText ? `${question.id}-help` : undefined}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            id={question.id}
            value={value !== undefined && value !== null && value !== "" ? value : ""}
            onChange={(e) => {
              const val = e.target.value;
              // Allow empty string or parse as number (including 0)
              handleChange(val === "" ? "" : Number(val));
            }}
            placeholder={question.placeholder}
            disabled={disabled}
            className={error ? "border-red-500" : ""}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${question.id}-error` : question.helpText ? `${question.id}-help` : undefined}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            id={question.id}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={error ? "border-red-500" : ""}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${question.id}-error` : question.helpText ? `${question.id}-help` : undefined}
          />
        );

      case "select":
        return (
          <select
            id={question.id}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500"
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${question.id}-error` : question.helpText ? `${question.id}-help` : undefined}
          >
            <option value="">Select an option...</option>
            {question.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleChange(e.target.value)}
                  disabled={disabled}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  aria-invalid={error ? "true" : "false"}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        const checkboxValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={option.value}
                  checked={checkboxValues.includes(option.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...checkboxValues, option.value]
                      : checkboxValues.filter((v) => v !== option.value);
                    handleChange(newValues);
                  }}
                  disabled={disabled}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  aria-invalid={error ? "true" : "false"}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case "yesno":
        return (
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="yes"
                checked={value === "yes" || value === true}
                onChange={() => handleChange("yes")}
                disabled={disabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                aria-invalid={error ? "true" : "false"}
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="no"
                checked={value === "no" || value === false}
                onChange={() => handleChange("no")}
                disabled={disabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                aria-invalid={error ? "true" : "false"}
              />
              <span className="text-sm">No</span>
            </label>
          </div>
        );

      default:
        return (
          <Input
            type="text"
            id={question.id}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.placeholder}
            disabled={disabled}
            className={error ? "border-red-500" : ""}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={question.id} className="flex items-center gap-2">
        {question.label}
        {question.required && (
          <span className="text-red-500" aria-label="required">
            *
          </span>
        )}
      </Label>
      {question.description && (
        <p className="text-sm text-gray-600">{question.description}</p>
      )}
      {renderInput()}
      {question.helpText && (
        <p id={`${question.id}-help`} className="text-xs text-gray-500">
          {question.helpText}
        </p>
      )}
      {error && (
        <p id={`${question.id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
