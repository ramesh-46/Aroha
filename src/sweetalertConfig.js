import Swal from "sweetalert2";

// Configure default options for SweetAlert globally
Swal.mixin({
  customClass: {
    container: 'system-swal-container',
    popup: 'system-swal-popup',
    title: 'system-swal-title',
    htmlContainer: 'system-swal-html-container',
    confirmButton: 'system-swal-confirm-btn',
    cancelButton: 'system-swal-cancel-btn',
    actions: 'system-swal-actions',
    icon: 'system-swal-icon'
  },
  backdrop: 'rgba(0, 0, 0, 0.4)',
  showClass: {
    popup: 'animate__animated animate__zoomIn animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__zoomOut animate__faster'
  },
  buttonsStyling: false,
  confirmButtonText: 'OK',
});

// For adding some custom CSS classes without editing all index.css immediately
const style = document.createElement("style");
style.innerHTML = `
.system-swal-popup {
  border-radius: 16px !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
  font-family: 'Inter', system-ui, sans-serif !important;
  padding: 24px !important;
}
.system-swal-title {
  font-weight: 700 !important;
  font-size: 1.25rem !important;
  color: #111827 !important;
}
.system-swal-html-container {
  font-size: 0.95rem !important;
  color: #4b5563 !important;
}
.system-swal-confirm-btn {
  background-color: #000 !important;
  color: #fff !important;
  border-radius: 8px !important;
  padding: 10px 24px !important;
  font-weight: 600 !important;
  border: none !important;
  cursor: pointer !important;
  transition: all 0.2s !important;
}
.system-swal-confirm-btn:hover {
  background-color: #333 !important;
}
.system-swal-cancel-btn {
  background-color: #f3f4f6 !important;
  color: #374151 !important;
  border-radius: 8px !important;
  padding: 10px 24px !important;
  font-weight: 600 !important;
  border: none !important;
  cursor: pointer !important;
  margin-left: 10px !important;
  transition: all 0.2s !important;
}
.system-swal-cancel-btn:hover {
  background-color: #e5e7eb !important;
}
`;
document.head.appendChild(style);

// Override the default Swal so it uses mixin
const SystemSwal = Swal.mixin({
  customClass: {
    container: 'system-swal-container',
    popup: 'system-swal-popup',
    title: 'system-swal-title',
    htmlContainer: 'system-swal-html-container',
    confirmButton: 'system-swal-confirm-btn',
    cancelButton: 'system-swal-cancel-btn'
  },
  buttonsStyling: false,
});

export default SystemSwal;
