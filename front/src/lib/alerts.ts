import Swal, { SweetAlertOptions } from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Configuration globale pour un style "premium" et cohérent
const defaultOptions: SweetAlertOptions = {
    customClass: {
        popup: 'bg-white rounded-[24px] shadow-2xl border border-slate-100 p-4',
        title: 'text-2xl font-black text-slate-800 tracking-tight',
        htmlContainer: 'text-sm font-medium text-slate-500 mt-2',
        confirmButton: 'px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100',
        cancelButton: 'px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition-all ml-3',
        actions: 'mt-6 gap-3 flex justify-center w-full'
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
    title: string;
    text: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
    danger?: boolean; // Si true, le bouton confirme sera rouge
}

export const showConfirm = async (options: ConfirmOptions): Promise<boolean> => {
    const confirmButtonClass = options.danger 
        ? 'px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100'
        : defaultOptions.customClass?.confirmButton;

    const result = await MySwal.fire({
        ...defaultOptions,
        title: options.title,
        text: options.text,
        icon: options.icon || 'warning',
        showCancelButton: true,
        confirmButtonText: options.confirmButtonText || 'Confirm',
        cancelButtonText: options.cancelButtonText || 'Cancel',
        customClass: {
            ...defaultOptions.customClass,
            confirmButton: confirmButtonClass as string
        }
    });

    return result.isConfirmed;
};

export const showAlert = async (title: string, text: string, icon: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    return MySwal.fire({
        ...defaultOptions,
        title,
        text,
        icon,
        confirmButtonText: 'OK',
    });
};
