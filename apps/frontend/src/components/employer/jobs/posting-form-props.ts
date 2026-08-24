// FILE: src/components/employer/jobs/posting-form-props.ts
// PostingForm's public contract. Split out for size (section 2), and it earns its
// own file anyway: these props are what the create and edit surfaces both code
// against, and the reasons behind each are the interesting part.

import type { PostingCreateInput } from '@/types/employer-jobs';
import type { PostingFormValues } from './posting-form-helpers';

export interface PostingFormProps {
  initialValues?: Partial<PostingCreateInput>;
  submitLabel: string;
  /**
   * Returning the saved posting is optional and only the CREATE surface needs to:
   * the form uses the new id to attach the assignment. Existing callers returning
   * Promise<void> still satisfy this.
   */
  onSubmit: (input: PostingCreateInput) => Promise<{ id: string } | void>;
  onCancel?: () => void;
  /** Fired on every field change — feeds the New page's live preview. */
  onValuesChange?: (values: PostingFormValues) => void;
  /**
   * Present only on the EDIT surface. Its absence is what tells the assignment
   * section it is on create — where there is no posting to attach to yet and
   * therefore nobody who could have applied. One form, two surfaces (rule 1).
   */
  postingId?: string;
  /** Optional override; the section reads it from the server when omitted. */
  applicationCount?: number;
  initialAssignmentId?: string | null;
  /**
   * Called once the WHOLE save succeeded, including the assignment attach. The
   * create surface navigates away here rather than inside onSubmit: navigating on
   * posting-created would unmount the form mid-flight and strand the attach.
   */
  onSubmitted?: (result: { id: string } | void) => void;
}
