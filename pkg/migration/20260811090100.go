// Vikunja is a to-do list application to facilitate your life.
// Copyright 2018-present Vikunja and contributors. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

package migration

import (
	"code.vikunja.io/api/pkg/config"

	"src.techknowlogick.com/xormigrate"
	"xorm.io/xorm"
)

func init() {
	migrations = append(migrations, &xormigrate.Migration{
		ID:          "20260811090100",
		Description: "Store repeat_month_days as varchar so Postgres DISTINCT works",
		Migrate: func(tx *xorm.Engine) error {
			// Fresh installs already get varchar from 20260811081609; this converts
			// databases that ran the earlier JSON variant.
			switch config.DatabaseType.GetString() {
			case "postgres":
				_, err := tx.Exec("ALTER TABLE tasks ALTER COLUMN repeat_month_days TYPE varchar(128) USING repeat_month_days::text")
				return err
			case "mysql":
				_, err := tx.Exec("ALTER TABLE tasks MODIFY COLUMN repeat_month_days varchar(128) NULL")
				return err
			default:
				// SQLite affinity already treats the column as TEXT.
				return nil
			}
		},
		Rollback: func(tx *xorm.Engine) error {
			return nil
		},
	})
}
