import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const showConfirm = async ({
    title = 'Are you sure?',
    text = 'Are you sure you want to perform this action?',
    confirmButtonText = 'Confirm',
    cancelButtonText = 'Cancel',
    icon = 'warning',
    danger = true
}: {
    title?: string;
    text?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
    danger?: boolean;
}) => {
    const result = await MySwal.fire({
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonColor: danger ? '#ef4444' : '#6366f1', // red-500 or indigo-500
        cancelButtonColor: '#94a3b8', // slate-400
        confirmButtonText,
        cancelButtonText,
        customClass: {
            popup: '!rounded-[32px] !shadow-2xl border border-slate-100 font-sans',
            title: '!text-slate-800 !font-black !text-2xl',
            htmlContainer: '!text-slate-500 !font-medium',
            confirmButton: '!rounded-2xl !font-bold !px-6 !py-3 !shadow-md',
            cancelButton: '!rounded-2xl !font-bold !px-6 !py-3',
        }
    });
    return result.isConfirmed;
};

export const showAlert = async (title: string, text?: string, icon: 'warning' | 'error' | 'success' | 'info' | 'question' = 'info') => {
    return MySwal.fire({
        title,
        text,
        icon,
        confirmButtonColor: '#6366f1',
        confirmButtonText: 'Understood',
        customClass: {
            popup: '!rounded-[32px] !shadow-2xl border border-slate-100 font-sans',
            title: '!text-slate-800 !font-black !text-2xl',
            htmlContainer: '!text-slate-500 !font-medium',
            confirmButton: '!rounded-2xl !font-bold !px-6 !py-3 !shadow-md',
        }
    });
};
