interface InputFieldProps {
    type?: string;
    placeholderText?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }
  
  export default function InputField({
    type = "text",
    placeholderText = "sesuatu",
    value,
    onChange,
  }: InputFieldProps) {
    return (
      <input
        type={type}
        placeholder={`Masukkan ${placeholderText}`}
        value={value}
        onChange={onChange}
        className="w-full px-6 py-3 border-2 border-[#4BA397] rounded-full text-center text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#4BA397] transition duration-200"
      />
    );
  }
  