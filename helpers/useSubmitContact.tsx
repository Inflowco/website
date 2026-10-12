import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { postContactSubmit, InputType, OutputType } from "../endpoints/contact/submit_POST.schema";

/**
 * React Query mutation hook for submitting the contact form.
 * Provides loading, error, and success states for the frontend.
 */
export const useSubmitContact = (options?: UseMutationOptions<OutputType, Error, InputType>) => {
  return useMutation({
    mutationFn: (data: InputType) => postContactSubmit(data),
    ...options,
  });
};