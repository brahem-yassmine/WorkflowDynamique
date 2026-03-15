import Swal, { SweetAlertOptions } from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Configuration globale pour un style "premium" et cohérent
const defaultOptions: SweetAlertOptions = {
    customClass: {
        popup: '!rounded-[32px] !shadow-2xl border border-slate-100 p-4 font-sans',
        title: '!text-2xl !font-black !text-slate-800 !tracking-tight',
        htmlContainer: '!text-sm !font-medium !text-slate-500 !mt-2',
        confirmButton: '!px-6 !py-3 !bg-indigo-600 !text-white !rounded-xl !font-bold !hover:bg-indigo-700 !transition-all !shadow-lg !shadow-indigo-100',
        cancelButton: '!px-6 !py-3 !bg-slate-100 !text-slate-500 !rounded-xl !font-bold !hover:bg-slate-200 !transition-all !ml-3',
        actions: '!mt-6 !gap-3 !flex !justify-center !w-full'
    },
    buttonsStyling: false,
    showClass: {
        popup: 'animate-in zoom-in-95 duration-200'
    },
    hideClass: {
        popup: 'animate-out zoom-out-95 duration-200'
    }
};

interface ConfirmOptions {
    title?: string;
    text?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
    danger?: boolean; // Si true, le bouton confirme sera rouge
}

export const showConfirm = async (options: ConfirmOptions | string): Promise<boolean> => {
    // Handle both object signatures
    const params = typeof options === 'string' ? { title: options } : options;
    const {
        title = 'Are you sure?',
        text = 'Are you sure you want to perform this action?',
        confirmButtonText = 'Confirm',
        cancelButtonText = 'Cancel',
        icon = 'warning',
        danger = true
    } = params;

    const confirmButtonClass = danger 
        ? '!px-6 !py-3 !bg-rose-600 !text-white !rounded-xl !font-bold !hover:bg-rose-700 !transition-all !shadow-lg !shadow-rose-100'
        : defaultOptions.customClass?.confirmButton;

    const result = await MySwal.fire({
        ...defaultOptions,
        title,
        text,
        icon: icon as any,
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText,
        customClass: {
            ...defaultOptions.customClass,
            confirmButton: confirmButtonClass as string
        }
    });

    return result.isConfirmed;
};

export const showAlert = async (title: string, text: string = '', icon: 'success' | 'error' | 'info' | 'warning' | 'question' = 'info') => {
    return MySwal.fire({
        ...defaultOptions,
        title,
        text,
        icon: icon as any,
        confirmButtonText: 'Understood',
    });
};
