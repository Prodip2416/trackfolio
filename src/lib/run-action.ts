import toast from 'react-hot-toast'

type ActionResult = { error?: string } | { success?: unknown } | void | null | undefined

/**
 * Runs a server action that reports failure via `{ error }` (not by throwing),
 * shows a toast either way, and returns true on success.
 */
export async function runAction(
  action: () => Promise<ActionResult>,
  successMessage?: string
): Promise<boolean> {
  try {
    const result = await action()
    if (result && 'error' in result && result.error) {
      toast.error(result.error)
      return false
    }
    if (successMessage) toast.success(successMessage)
    return true
  } catch (err) {
    console.error(err)
    toast.error(err instanceof Error && err.message ? err.message : 'Something went wrong. Please try again.')
    return false
  }
}
