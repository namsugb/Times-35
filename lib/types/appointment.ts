export interface Appointment {
    id: string
    share_token: string
    title: string
    method: 'all-available' | 'max-available' | 'minimum-required' | 'recurring'
    start_date?: string
    end_date?: string
    deadline?: string
    creator_phone?: string
}