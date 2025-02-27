import { html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import memoizeOne from "memoize-one";
import { fireEvent, HomeAssistant } from "../../../ha";
import setupCustomlocalize from "../../../localize";
import { computeActionsFormSchema } from "../../../shared/config/actions-config";
import { GENERIC_LABELS } from "../../../utils/form/generic-fields";
import { HaFormSchema } from "../../../utils/form/ha-form";
import { UiAction } from "../../../utils/form/ha-selector";
import { stateIcon } from "../../../utils/icons/state-icon";
import { computeChipEditorComponentName } from "../../../utils/lovelace/chip/chip-element";
import { AlarmControlPanelChipConfig } from "../../../utils/lovelace/chip/types";
import { LovelaceChipEditor } from "../../../utils/lovelace/types";
import { ALARM_CONTROl_PANEL_ENTITY_DOMAINS } from "../../alarm-control-panel-card/const";

const actions: UiAction[] = ["more-info", "navigate", "url", "call-service", "none"];

const computeSchema = memoizeOne((version: string, icon?: string): HaFormSchema[] => [
    { name: "entity", selector: { entity: { domain: ALARM_CONTROl_PANEL_ENTITY_DOMAINS } } },
    {
        type: "grid",
        name: "",
        schema: [
            { name: "name", selector: { text: {} } },
            { name: "content_info", selector: { "mush-info": {} } },
        ],
    },
    { name: "icon", selector: { icon: { placeholder: icon } } },
    ...computeActionsFormSchema(version, actions),
]);

@customElement(computeChipEditorComponentName("alarm-control-panel"))
export class AlarmControlPanelChipEditor extends LitElement implements LovelaceChipEditor {
    @property({ attribute: false }) public hass?: HomeAssistant;

    @state() private _config?: AlarmControlPanelChipConfig;

    public setConfig(config: AlarmControlPanelChipConfig): void {
        this._config = config;
    }

    private _computeLabel = (schema: HaFormSchema) => {
        const customLocalize = setupCustomlocalize(this.hass!);

        if (GENERIC_LABELS.includes(schema.name)) {
            return customLocalize(`editor.card.generic.${schema.name}`);
        }
        return this.hass!.localize(`ui.panel.lovelace.editor.card.generic.${schema.name}`);
    };

    protected render(): TemplateResult {
        if (!this.hass || !this._config) {
            return html``;
        }

        const entityState = this._config.entity ? this.hass.states[this._config.entity] : undefined;
        const entityIcon = entityState ? stateIcon(entityState) : undefined;
        const icon = this._config.icon || entityIcon;
        const schema = computeSchema(this.hass.connection.haVersion, icon);

        return html`
            <ha-form
                .hass=${this.hass}
                .data=${this._config}
                .schema=${schema}
                .computeLabel=${this._computeLabel}
                @value-changed=${this._valueChanged}
            ></ha-form>
        `;
    }

    private _valueChanged(ev: CustomEvent): void {
        fireEvent(this, "config-changed", { config: ev.detail.value });
    }
}
