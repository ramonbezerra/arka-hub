import { Icon } from '@iconify/react';

const MultiSelect = ({ label, options, values, onChange, placeholder = 'Select...' }) => {
    const handleAdd = (value) => {
        if (!values.includes(value)) {
            onChange([...values, value]);
        }
    };

    const handleRemove = (value) => {
        onChange(values.filter(v => v !== value));
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            
            {/* Selected items as removable chips */}
            {values.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {values.map((value) => {
                        const option = options.find(opt => opt.value === value);
                        return (
                            <div
                                key={value}
                                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                            >
                                <span>{option?.label || value}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemove(value)}
                                    className="hover:text-blue-600 transition-colors"
                                    title="Remove"
                                >
                                    <Icon icon="mdi:close" width={16} height={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Dropdown to add items */}
            <select
                onChange={(e) => {
                    if (e.target.value) {
                        handleAdd(e.target.value);
                        e.target.value = '';
                    }
                }}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
                <option value="">{placeholder}</option>
                {options
                    .filter(opt => !values.includes(opt.value))
                    .map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
            </select>
        </div>
    );
};

export default MultiSelect;
