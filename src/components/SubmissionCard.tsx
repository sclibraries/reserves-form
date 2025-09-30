import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, SubmissionStatus } from "./StatusBadge";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export interface Submission {
  id: string;
  courseCode: string;
  courseTitle: string;
  term: string;
  status: SubmissionStatus;
  totalItems: number;
  completeItems: number;
  inProgressItems: number;
  needsReviewItems: number;
  lastUpdated: string;
}

interface SubmissionCardProps {
  submission: Submission;
}

export const SubmissionCard = ({ submission }: SubmissionCardProps) => {
  const navigate = useNavigate();

  const handleOpen = () => {
    if (submission.status === "draft") {
      navigate(`/submission/${submission.id}/edit`);
    } else {
      navigate(`/submission/${submission.id}`);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleOpen}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight truncate">
              {submission.courseCode} · {submission.courseTitle}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {submission.term}
            </Badge>
          </div>
          <StatusBadge status={submission.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Items: {submission.totalItems} · {submission.completeItems} complete · {submission.inProgressItems} in progress · {submission.needsReviewItems} needs review
        </p>
        <p className="text-xs text-muted-foreground">
          Last updated: {submission.lastUpdated}
        </p>
      </CardContent>

      <CardFooter className="gap-2">
        <Button 
          variant="default" 
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            handleOpen();
          }}
        >
          Open
        </Button>
        <Button 
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            handleOpen();
          }}
        >
          View Status
        </Button>
        {submission.status === "draft" && (
          <Button 
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/submission/${submission.id}/edit`);
            }}
          >
            Continue Editing
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
