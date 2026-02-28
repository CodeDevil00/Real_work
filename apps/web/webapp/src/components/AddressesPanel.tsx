import type { Address } from "../types/app";

type AddressForm = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type Props = {
  isLoggedIn: boolean;
  addressForm: AddressForm;
  addressLoading: boolean;
  addresses: Address[];
  selectedAddressId: string;
  onRefresh: () => void;
  onAddressFieldChange: <K extends keyof AddressForm>(field: K, value: AddressForm[K]) => void;
  onSave: () => void;
  onSelectAddress: (addressId: string) => void;
};

export default function AddressesPanel({
  isLoggedIn,
  addressForm,
  addressLoading,
  addresses,
  selectedAddressId,
  onRefresh,
  onAddressFieldChange,
  onSave,
  onSelectAddress,
}: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Addresses</h2>
        <button className="ghost" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      {!isLoggedIn ? <p className="muted">Login to manage addresses.</p> : null}

      <div className="stack">
        <label>
          Full name
          <input
            value={addressForm.fullName}
            onChange={(event) => onAddressFieldChange("fullName", event.target.value)}
          />
        </label>
        <label>
          Phone
          <input
            value={addressForm.phone}
            onChange={(event) => onAddressFieldChange("phone", event.target.value)}
          />
        </label>
        <label>
          Line 1
          <input
            value={addressForm.line1}
            onChange={(event) => onAddressFieldChange("line1", event.target.value)}
          />
        </label>
        <label>
          Line 2
          <input
            value={addressForm.line2}
            onChange={(event) => onAddressFieldChange("line2", event.target.value)}
          />
        </label>
        <label>
          City
          <input
            value={addressForm.city}
            onChange={(event) => onAddressFieldChange("city", event.target.value)}
          />
        </label>
        <label>
          State
          <input
            value={addressForm.state}
            onChange={(event) => onAddressFieldChange("state", event.target.value)}
          />
        </label>
        <label>
          Postal code
          <input
            value={addressForm.postalCode}
            onChange={(event) => onAddressFieldChange("postalCode", event.target.value)}
          />
        </label>
        <button onClick={onSave} disabled={addressLoading || !isLoggedIn}>
          {addressLoading ? "Saving..." : "Save address"}
        </button>
      </div>

      <div className="stack top-gap">
        {addresses.map((address) => (
          <label key={address.id} className="address-card">
            <input
              type="radio"
              name="selected-address"
              checked={selectedAddressId === address.id}
              onChange={() => onSelectAddress(address.id)}
            />
            <span>
              {address.fullName}, {address.line1}, {address.city}, {address.state} {address.postalCode}
              {address.isDefault ? " (default)" : ""}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
