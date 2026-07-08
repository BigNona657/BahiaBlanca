export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 text-center">
        <div className="text-5xl mb-4">✉️</div>
        <h2 className="text-xl font-bold mb-2">Revisá tu email</h2>
        <p className="text-gray-500 text-sm">
          Te enviamos un link mágico para ingresar. Puede tardar unos segundos.
        </p>
      </div>
    </div>
  );
}
