"use client";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CommentSection from "./CommentSection";
import CodeDisplay from "./CodeDisplay";
import { getNameFromRoll, formatDate } from "./utils";

const SnippetCard = ({
  snippet,
  isExpanded,
  onToggleExpand,
  onToggleLike,
  onCopyCode,
  copiedStates,
  animateLike,
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-sm">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex justify-between items-start">
          <Badge variant="secondary" className="text-xs font-semibold uppercase">
            {snippet.language}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDate(snippet.date)}
          </span>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {snippet.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {snippet.description}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-3 pb-3">
        <CodeDisplay
          snippet={snippet}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          onCopyCode={onCopyCode}
          copiedStates={copiedStates}
        />

        {/* About the author and code interaction */}
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-muted-foreground">
            {getNameFromRoll(snippet.rollNumber) + ` (${snippet.rollNumber})`}
          </span>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className={`p-2 ${
                snippet.isLiked
                  ? "text-red-500"
                  : "text-muted-foreground"
              } hover:text-red-500 ${
                animateLike[snippet.id] ? "animate-bounce" : ""
              }`}
              onClick={() => onToggleLike(snippet.id)}
            >
              <FontAwesomeIcon 
                icon={snippet.isLiked ? faHeart : faHeartRegular} 
                className="h-4 w-4"
              />
            </Button>
            <span
              className={`text-muted-foreground text-sm ${
                animateLike[snippet.id] ? "animate-bounce" : ""
              }`}
            >
              {snippet.likesCount || 0} Likes
            </span>
          </div>
        </div>

        {/* Comment Section */}
        <CommentSection snippet={snippet} />
      </CardContent>
    </Card>
  );
};

export default SnippetCard;
