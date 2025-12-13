"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { ref, push, serverTimestamp } from "firebase/database";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";
import { ibmPlexSans } from "@/app/ui/fonts";

const AppPublishForm = ({ isOpen, onClose, user }) => {
  const [formData, setFormData] = useState({
    appName: "",
    purpose: "",
    githubUrl: "",
    liveLink: "",
    isAiUsed: "",
    aiPurpose: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({
      ...prev,
      isAiUsed: value,
      // Clear AI purpose if "No" is selected
      aiPurpose: value === "no" ? "" : prev.aiPurpose
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.appName.trim() || !formData.purpose.trim() || !formData.githubUrl.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate GitHub URL
    const githubUrlPattern = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+/;
    if (!githubUrlPattern.test(formData.githubUrl)) {
      toast.error("Please enter a valid GitHub URL");
      return;
    }

    // Validate Live Link if provided
    if (formData.liveLink && !formData.liveLink.startsWith('http')) {
      toast.error("Live link must start with http:// or https://");
      return;
    }

    // Validate AI usage
    if (formData.isAiUsed === "yes" && !formData.aiPurpose.trim()) {
      toast.error("Please specify how AI was used");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const appsRef = ref(db, 'publishedApps');
      const appData = {
        ...formData,
        authorName: user.name,
        authorRoll: user.roll,
        publishedAt: serverTimestamp(),
        upvotes: 0,
        downvotes: 0,
        voters: {}, // Track who voted to prevent duplicate votes
        status: "published"
      };

      await push(appsRef, appData);
      
      toast.success("App published successfully!");
      
      // Reset form
      setFormData({
        appName: "",
        purpose: "",
        githubUrl: "",
        liveLink: "",
        isAiUsed: "",
        aiPurpose: "",
      });
      
      onClose();
    } catch (error) {
      console.error("Error publishing app:", error);
      toast.error("Failed to publish app. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={`${ibmPlexSans.className} text-xl font-semibold`}>
            Publish Your App
          </DialogTitle>
        </DialogHeader>
        
        <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* App Name */}
              <div className="space-y-2">
                <Label htmlFor="appName" className="text-sm font-medium">
                  App Name *
                </Label>
                <Input
                  id="appName"
                  name="appName"
                  value={formData.appName}
                  onChange={handleInputChange}
                  placeholder="Enter your app name"
                  required
                />
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <Label htmlFor="purpose" className="text-sm font-medium">
                  Purpose *
                </Label>
                <Textarea
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  placeholder="Describe what your app does and its main purpose"
                  rows={3}
                  required
                />
              </div>

              {/* GitHub URL */}
              <div className="space-y-2">
                <Label htmlFor="githubUrl" className="text-sm font-medium">
                  GitHub URL *
                </Label>
                <Input
                  id="githubUrl"
                  name="githubUrl"
                  value={formData.githubUrl}
                  onChange={handleInputChange}
                  placeholder="https://github.com/username/repository"
                  required
                />
              </div>

              {/* Live Link */}
              <div className="space-y-2">
                <Label htmlFor="liveLink" className="text-sm font-medium">
                  Live Link (Optional)
                </Label>
                <Input
                  id="liveLink"
                  name="liveLink"
                  value={formData.liveLink}
                  onChange={handleInputChange}
                  placeholder="https://your-app.com"
                />
              </div>

              {/* AI Usage */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Is AI used? *
                </Label>
                <Select value={formData.isAiUsed} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select if AI was used" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* AI Purpose - only show if AI is used */}
              {formData.isAiUsed === "yes" && (
                <div className="space-y-2">
                  <Label htmlFor="aiPurpose" className="text-sm font-medium">
                    For what purpose was AI used? *
                  </Label>
                  <Textarea
                    id="aiPurpose"
                    name="aiPurpose"
                    value={formData.aiPurpose}
                    onChange={handleInputChange}
                    placeholder="Describe how and why AI was used in your project"
                    rows={2}
                    required
                  />
                </div>
              )}

              {/* Author Info Display */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Published by:</span> {user.name} ({user.roll})
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Date & time will be automatically recorded
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Publishing..." : "Publish App"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default AppPublishForm;